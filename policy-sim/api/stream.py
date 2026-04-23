"""Wire SimulationEngine callbacks to SSE frames via asyncio.Queue."""

import asyncio
import json
import os
from pathlib import Path
from typing import Any, AsyncGenerator

from simulation.engine import RunCallbacks, SimulationEngine
from simulation.replay import replay_run
from simulation.utils import read_json, read_jsonl, RunPaths
from simulation.validation import validate_run

_IFS_PATH = Path(__file__).parent.parent / "knowledge_base" / "fiscal" / "ifs_2011_validation.json"
_RUNS_ROOT = Path(os.environ.get("SIMULATION_RUNS_ROOT", str(Path(__file__).parent.parent / "simulation_runs")))


def _frame(event: str, data: Any) -> dict:
    return {"event": event, "data": json.dumps(data)}


async def live_stream(run_id: str, engine: SimulationEngine) -> AsyncGenerator[dict, None]:
    """Run the full pipeline, yielding SSE frames for every event."""
    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    archetype_ids = [p["id"] for p in engine._personas]
    state = engine.status(run_id)

    yield _frame("run_started", {
        "run_id": run_id,
        "scenario_path": state.get("scenario"),
        "archetype_ids": archetype_ids,
    })

    async def put(event: str, data: Any) -> None:
        await queue.put(_frame(event, data))

    supervisor_parts: list[str] = []

    async def on_supervisor_token(token: str) -> None:
        supervisor_parts.append(token)
        await put("supervisor_text", {"token": token})

    callbacks = RunCallbacks(
        on_supervisor_text=on_supervisor_token,
        on_thinking={
            aid: (lambda a: lambda t: put("thinking", {"archetype_id": a, "token": t}))(aid)
            for aid in archetype_ids
        },
        on_reaction_delta={
            aid: (lambda a: lambda t: put("reaction_delta", {"archetype_id": a, "token": t}))(aid)
            for aid in archetype_ids
        },
        on_reaction_complete={
            aid: (lambda a: lambda r: put("reaction_complete", {"archetype_id": a, "reaction": r}))(aid)
            for aid in archetype_ids
        },
        on_audio_ready=lambda aid, fname: put("audio_ready", {"archetype_id": aid, "filename": fname}),
        on_brief_text=lambda t: put("brief_text", {"token": t}),
    )

    async def run_pipeline() -> None:
        try:
            briefings = await engine.brief(run_id, on_supervisor_text=callbacks.on_supervisor_text)
            briefings_by_id = {b["archetype_id"]: b for b in briefings}

            # Persist supervisor text for replay
            if supervisor_parts:
                sup_path = _RUNS_ROOT / run_id / "supervisor_text.txt"
                sup_path.write_text("".join(supervisor_parts), encoding="utf-8")

            await queue.put(_frame("supervisor_done", {"briefings": briefings_by_id}))

            await engine.react_parallel(run_id, callbacks=callbacks)

            brief_text = await engine.report(run_id, on_brief_text=callbacks.on_brief_text)
            await queue.put(_frame("brief_done", {"markdown": brief_text}))

            run_dir = _RUNS_ROOT / run_id
            if _IFS_PATH.exists() and run_dir.exists():
                try:
                    validation = validate_run(run_dir, _IFS_PATH)
                    await queue.put(_frame("validation", validation))
                except Exception as exc:
                    await queue.put(_frame("validation", {"error": str(exc)}))

        except Exception as exc:
            await queue.put(_frame("error", {"phase": "pipeline", "message": str(exc)}))
        finally:
            await queue.put(None)

    task = asyncio.create_task(run_pipeline())

    try:
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
    except asyncio.CancelledError:
        task.cancel()
        raise

    yield _frame("done", {})


async def replay_stream(run_id: str, delay_ms: int = 30) -> AsyncGenerator[dict, None]:
    """Replay a completed run from cached artifacts with artificial pacing."""
    run_dir = _RUNS_ROOT / run_id
    state_path = run_dir / "state.json"
    if not state_path.exists():
        yield _frame("error", {"phase": "replay", "message": f"Run {run_id} not found"})
        return

    state = read_json(state_path)
    paths = RunPaths(run_dir=run_dir)

    # Collect archetype IDs from saved briefings
    archetype_ids = [p.stem for p in sorted(paths.briefings_dir.glob("*.json"))] if paths.briefings_dir.exists() else []

    yield _frame("run_started", {
        "run_id": run_id,
        "scenario_path": state.get("scenario_path"),
        "archetype_ids": archetype_ids,
        "replay": True,
    })

    await asyncio.sleep(delay_ms / 1000)

    # Supervisor text — stream token-by-token if saved, else skip
    sup_text_path = run_dir / "supervisor_text.txt"
    if sup_text_path.exists():
        sup_text = sup_text_path.read_text(encoding="utf-8")
        chunk = 6  # characters per token for paced replay
        for i in range(0, len(sup_text), chunk):
            yield _frame("supervisor_text", {"token": sup_text[i:i + chunk]})
            await asyncio.sleep(delay_ms / 1000)

    # Supervisor done — emit from saved briefings
    if paths.briefings_dir.exists():
        briefings_by_id = {
            p.stem: read_json(p)
            for p in sorted(paths.briefings_dir.glob("*.json"))
        }
        yield _frame("supervisor_done", {"briefings": briefings_by_id})
        await asyncio.sleep(delay_ms / 1000)

    # Replay archetype JSONL events
    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    async def on_archetype_event(archetype_id: str, event_type: str, token: str) -> None:
        if event_type == "thinking":
            await queue.put(_frame("thinking", {"archetype_id": archetype_id, "token": token}))
        elif event_type == "tool_delta":
            await queue.put(_frame("reaction_delta", {"archetype_id": archetype_id, "token": token}))
        await asyncio.sleep(delay_ms / 1000)

    async def run_replay() -> None:
        try:
            reactions = await replay_run(
                run_id=run_id,
                runs_root=_RUNS_ROOT,
                on_event=on_archetype_event,
                delay_ms=0,  # pacing handled in on_archetype_event
            )
            for aid, reaction in reactions.items():
                if reaction:
                    await queue.put(_frame("reaction_complete", {"archetype_id": aid, "reaction": reaction}))
                    await asyncio.sleep(delay_ms / 1000)
        except Exception as exc:
            await queue.put(_frame("error", {"phase": "replay", "message": str(exc)}))
        finally:
            await queue.put(None)

    task = asyncio.create_task(run_replay())

    try:
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
    except asyncio.CancelledError:
        task.cancel()
        raise

    # Audio — emit audio_ready for any cached mp3 files
    audio_dir = run_dir / "audio"
    if audio_dir.exists():
        for mp3 in sorted(audio_dir.glob("*.mp3")):
            yield _frame("audio_ready", {"archetype_id": mp3.stem, "filename": mp3.name})
            await asyncio.sleep(delay_ms / 1000)

    # Brief done — emit from saved brief.md
    if paths.brief.exists():
        brief_text = paths.brief.read_text(encoding="utf-8")
        yield _frame("brief_done", {"markdown": brief_text})
        await asyncio.sleep(delay_ms / 1000)

    # Validation — emit from saved validation.json
    if paths.validation.exists():
        validation = read_json(paths.validation)
        yield _frame("validation", validation)
        await asyncio.sleep(delay_ms / 1000)

    yield _frame("done", {})
