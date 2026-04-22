"""ArchetypeReactionObserver — wraps streaming archetype call as an Observer."""

import asyncio
from typing import Any

from .base import Observer


class ArchetypeReactionObserver(Observer):
    """Observer that runs one archetype's reaction via the SimulationEngine.

    Implements the Observer ABC for compatibility with the secondary
    Claude Code runtime. Primary runtime uses SimulationEngine directly.
    """

    def __init__(self, archetype_id: str, engine: Any, run_id: str) -> None:
        self.archetype_id = archetype_id
        self._engine = engine
        self._run_id = run_id

    @property
    def source(self) -> str:
        return f"archetype-{self.archetype_id}"

    def evaluate(self, suggestions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Run archetype reaction for the given briefing (first element of suggestions)."""
        from ..engine import RunCallbacks
        from ..streaming import load_skill, stream_archetype
        from ..utils import read_json
        from pathlib import Path

        briefing = suggestions[0] if suggestions else {}
        persona = next(
            (p for p in self._engine._personas if p["id"] == self.archetype_id),
            {},
        )
        skill_body = load_skill(self._engine._archetype_skill)

        async def _run() -> dict[str, Any]:
            return await stream_archetype(
                self._engine._client,
                persona=persona,
                briefing=briefing,
                skill_body=skill_body,
            )

        reaction = asyncio.run(_run())
        return [{"archetype_id": self.archetype_id, "reaction": reaction}]
