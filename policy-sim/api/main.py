"""FastAPI application — SSE-backed policy simulation API."""

import asyncio
import os
from pathlib import Path

import sentry_sdk
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sse_starlette.sse import EventSourceResponse

from simulation.engine import SimulationEngine
from simulation.utils import RunPaths

from .auth import ApiKeyMiddleware
from .scenarios import list_scenarios
from .stream import live_stream, replay_stream

# ---------------------------------------------------------------------------
# Sentry
# ---------------------------------------------------------------------------

_SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if _SENTRY_DSN:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.2,
        environment=os.environ.get("ENVIRONMENT", "production"),
    )

# ---------------------------------------------------------------------------
# App + middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="policy-sim API", docs_url=None, redoc_url=None)

app.add_middleware(ApiKeyMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Engine (singleton per worker process)
# ---------------------------------------------------------------------------

_RUNS_ROOT = Path(os.environ.get("SIMULATION_RUNS_ROOT", Path(__file__).parent.parent / "simulation_runs"))
_engine = SimulationEngine(runs_root=_RUNS_ROOT)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/smoke")
async def smoke():
    """SSE buffering test — emits 20 ticks at 500ms intervals. Used to verify Vercel → Azure streaming works."""
    async def _ticks():
        for n in range(20):
            yield {"data": f"tick {n}"}
            await asyncio.sleep(0.5)
    return EventSourceResponse(_ticks())


@app.get("/api/debug/boom")
async def debug_boom():
    raise RuntimeError("Intentional Sentry test exception")


@app.get("/api/scenarios")
async def scenarios():
    return list_scenarios()


@app.post("/api/runs")
async def create_run(body: dict):
    scenario_path = body.get("scenario_path")
    if not scenario_path:
        raise HTTPException(status_code=422, detail="scenario_path is required")
    try:
        state = _engine.init_run(scenario_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"run_id": state["run_id"]}


@app.get("/api/runs/{run_id}/stream")
async def stream_run(run_id: str):
    try:
        _engine.status(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    return EventSourceResponse(live_stream(run_id, _engine))


@app.get("/api/runs/{run_id}/replay")
async def replay_run_endpoint(run_id: str, delay_ms: int = 30):
    run_dir = _RUNS_ROOT / run_id
    if not run_dir.exists():
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return EventSourceResponse(replay_stream(run_id, delay_ms=delay_ms))


@app.get("/api/runs/{run_id}/brief")
async def get_brief(run_id: str):
    paths = RunPaths(run_dir=_RUNS_ROOT / run_id)
    if not paths.brief.exists():
        raise HTTPException(status_code=404, detail="Brief not yet generated")
    return {"markdown": paths.brief.read_text(encoding="utf-8")}


@app.get("/api/runs/{run_id}/validation")
async def get_validation(run_id: str):
    paths = RunPaths(run_dir=_RUNS_ROOT / run_id)
    if not paths.validation.exists():
        raise HTTPException(status_code=404, detail="Validation not yet run")
    from simulation.utils import read_json
    return read_json(paths.validation)


@app.get("/api/runs/{run_id}/audio/{filename}")
async def get_audio(run_id: str, filename: str):
    audio_path = _RUNS_ROOT / run_id / "audio" / filename
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(str(audio_path), media_type="audio/mpeg")
