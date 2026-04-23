"""Replay module: rehydrates completed run JSONL with artificial pacing."""

import asyncio
from pathlib import Path
from typing import Any, Awaitable, Callable

from .utils import RunPaths, read_jsonl

# event_type: "thinking" | "tool_delta"
ReplayEventCallback = Callable[[str, str, str], Awaitable[None]] | None
# signature: (archetype_id, event_type, token) -> None


async def replay_archetype(
    archetype_id: str,
    reaction_jsonl: Path,
    on_event: ReplayEventCallback = None,
    delay_ms: int = 25,
) -> dict[str, Any] | None:
    """Re-emit events from a single archetype JSONL file with pacing. Returns final reaction."""
    events = read_jsonl(reaction_jsonl)
    result: dict[str, Any] | None = None

    has_thinking = any(ev.get("event") == "thinking" for ev in events)
    synthetic_emitted = False

    for ev in events:
        event_type = ev.get("event")
        if event_type in ("thinking", "tool_delta"):
            # Inject synthetic reasoning token before first tool_delta if run has no thinking
            if event_type == "tool_delta" and not has_thinking and not synthetic_emitted:
                synthetic_emitted = True
                if on_event:
                    await on_event(
                        archetype_id,
                        "thinking",
                        f"Reasoning as {archetype_id.replace('_', ' ')}...\n\nConsidering household finances, regional costs, and personal circumstances against the policy briefing...\n",
                    )
                await asyncio.sleep(delay_ms / 1000)
            if on_event:
                await on_event(archetype_id, event_type, ev.get("token", ""))
            await asyncio.sleep(delay_ms / 1000)
        elif event_type == "complete":
            result = ev.get("data")

    return result


async def replay_run(
    run_id: str,
    runs_root: Path,
    on_event: ReplayEventCallback = None,
    delay_ms: int = 25,
) -> dict[str, dict[str, Any]]:
    """Replay all archetypes in parallel from a completed run. Returns reactions dict."""
    paths = RunPaths(run_dir=runs_root / run_id)

    if not paths.reactions_dir.exists():
        raise FileNotFoundError(f"No reactions found for run '{run_id}'")

    reaction_files = sorted(paths.reactions_dir.glob("*.jsonl"))

    async def _replay_one(jsonl_path: Path) -> tuple[str, dict[str, Any] | None]:
        archetype_id = jsonl_path.stem
        result = await replay_archetype(
            archetype_id=archetype_id,
            reaction_jsonl=jsonl_path,
            on_event=on_event,
            delay_ms=delay_ms,
        )
        return archetype_id, result

    results = await asyncio.gather(*[_replay_one(f) for f in reaction_files])
    return {aid: r for aid, r in results if r is not None}
