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
from simulation.utils import RunPaths, read_json, read_last_complete_event

from .auth import ApiKeyMiddleware
from .scenarios import list_scenarios, list_policies, get_policy
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


@app.get("/api/policies")
async def policies():
    return list_policies()


@app.post("/api/runs")
async def create_run(body: dict):
    scenario_path = body.get("scenario_path")
    if not scenario_path:
        raise HTTPException(status_code=422, detail="scenario_path is required")
    archetype_ids = body.get("archetype_ids")
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


@app.get("/api/runs/compare")
async def compare_runs(runs: str):
    """Side-by-side stance scores for multiple completed runs."""
    run_ids = [r.strip() for r in runs.split(",") if r.strip()]
    if not run_ids:
        raise HTTPException(status_code=422, detail="runs query param required (comma-separated IDs)")

    runs_data: list[dict] = []
    for run_id in run_ids:
        run_dir = _RUNS_ROOT / run_id
        paths = RunPaths(run_dir=run_dir)
        state_path = run_dir / "state.json"
        if not state_path.exists():
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

        state = read_json(state_path)
        scenario_path = state.get("scenario_path", "")
        policy_label = Path(scenario_path).stem.replace("_", " ").title()

        archetype_scores: dict = {}
        if paths.reactions_dir.exists():
            for p in sorted(paths.reactions_dir.glob("*.jsonl")):
                complete = read_last_complete_event(p)
                if complete:
                    archetype_scores[p.stem] = {
                        "score": complete.get("support_or_oppose", 0.0),
                        "name": complete.get("display_name", p.stem),
                    }

        runs_data.append({
            "run_id": run_id,
            "policy_label": policy_label,
            "archetype_scores": archetype_scores,
        })

    return {"runs": runs_data}


@app.get("/api/runs/compare/briefs")
async def compare_briefs(runs: str):
    """Side-by-side brief markdown for multiple completed runs."""
    run_ids = [r.strip() for r in runs.split(",") if r.strip()]
    if not run_ids:
        raise HTTPException(status_code=422, detail="runs query param required")

    briefs: list[dict] = []
    for run_id in run_ids:
        run_dir = _RUNS_ROOT / run_id
        paths = RunPaths(run_dir=run_dir)
        state = read_json(run_dir / "state.json") if (run_dir / "state.json").exists() else {}
        policy_label = Path(state.get("scenario_path", "")).stem.replace("_", " ").title()

        markdown = ""
        if paths.brief.exists():
            markdown = paths.brief.read_text(encoding="utf-8")

        briefs.append({
            "run_id": run_id,
            "policy_label": policy_label,
            "markdown": markdown,
        })

    return {"briefs": briefs}
