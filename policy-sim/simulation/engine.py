"""SimulationEngine — orchestrates the supervisor → archetypes → reporter pipeline."""

import asyncio
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Awaitable, Callable

import anthropic
from dotenv import load_dotenv

from .caching import make_cache_block
from .streaming import (
    EventCallback,
    TextCallback,
    load_skill,
    stream_archetype,
    stream_reporter,
    stream_supervisor,
)
from .utils import (
    RunPaths,
    append_jsonl,
    generate_run_id,
    read_json,
    read_jsonl,
    utc_now_iso,
    write_json,
)

load_dotenv()

_PROJECT_ROOT = Path(__file__).parent.parent


@dataclass
class RunCallbacks:
    """Optional UI callbacks supplied by the Streamlit app (or CLI printer)."""
    on_supervisor_text: TextCallback = None
    on_thinking: dict[str, Callable[[str], Awaitable[None]]] = field(default_factory=dict)
    on_reaction_delta: dict[str, Callable[[str], Awaitable[None]]] = field(default_factory=dict)
    on_brief_text: TextCallback = None


class SimulationEngine:
    """Orchestrates the full simulation pipeline with persisted run state."""

    def __init__(self, runs_root: str | Path = "simulation_runs") -> None:
        self.runs_root = Path(runs_root)
        self.runs_root.mkdir(parents=True, exist_ok=True)
        self._client = anthropic.AsyncAnthropic()

        skills = _PROJECT_ROOT / ".claude" / "skills"
        self._supervisor_skill = skills / "supervisor-agent" / "SKILL.md"
        self._archetype_skill = skills / "archetype-agent" / "SKILL.md"
        self._reporter_skill = skills / "reporting-agent" / "SKILL.md"

        self._personas: list[dict[str, Any]] = [
            read_json(p)
            for p in sorted((_PROJECT_ROOT / "data" / "archetypes").glob("*.json"))
        ]

    # ------------------------------------------------------------------
    # Path / state helpers
    # ------------------------------------------------------------------

    def _paths(self, run_id: str) -> RunPaths:
        return RunPaths(run_dir=self.runs_root / run_id)

    def _load_state(self, run_id: str) -> dict[str, Any]:
        paths = self._paths(run_id)
        if not paths.state.exists():
            raise FileNotFoundError(f"Run '{run_id}' not found at {paths.run_dir}")
        return read_json(paths.state)

    def _save_state(self, run_id: str, state: dict[str, Any]) -> None:
        write_json(self._paths(run_id).state, state)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def init_run(self, scenario_path: str | Path) -> dict[str, Any]:
        """Initialise a run from a scenario file. Returns state dict including run_id."""
        scenario_path = Path(scenario_path).resolve()
        if not scenario_path.exists():
            raise FileNotFoundError(f"Scenario not found: {scenario_path}")

        run_id = generate_run_id()
        state: dict[str, Any] = {
            "run_id": run_id,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
            "status": "initialized",
            "scenario_path": str(scenario_path),
        }
        self._save_state(run_id, state)
        return state

    async def brief(
        self,
        run_id: str,
        on_supervisor_text: TextCallback = None,
    ) -> list[dict[str, Any]]:
        """Run supervisor: produce personalised briefings for all archetypes."""
        state = self._load_state(run_id)
        paths = self._paths(run_id)

        policy_text = Path(state["scenario_path"]).read_text(encoding="utf-8")
        skill_body = load_skill(self._supervisor_skill)

        kb_dir = _PROJECT_ROOT / "knowledge_base" / "fiscal"
        knowledge_parts = [
            f"# {kf.name}\n\n{kf.read_text(encoding='utf-8')}"
            for kf in sorted(kb_dir.glob("*.md"))
        ]
        knowledge_context = "\n\n---\n\n".join(knowledge_parts)

        briefings = await stream_supervisor(
            self._client,
            policy_text=policy_text,
            personas=self._personas,
            skill_body=skill_body,
            knowledge_context=knowledge_context,
            on_text=on_supervisor_text,
        )

        for b in briefings:
            write_json(paths.briefing(b["archetype_id"]), b)

        state["status"] = "briefed"
        state["updated_at"] = utc_now_iso()
        self._save_state(run_id, state)
        return briefings

    async def react_parallel(
        self,
        run_id: str,
        callbacks: RunCallbacks | None = None,
    ) -> dict[str, dict[str, Any]]:
        """Run all four archetype calls in parallel. Persists JSONL events for replay."""
        paths = self._paths(run_id)
        skill_body = load_skill(self._archetype_skill)

        briefings_by_id = {
            p.stem: read_json(p)
            for p in paths.briefings_dir.glob("*.json")
        } if paths.briefings_dir.exists() else {}

        cbs = callbacks or RunCallbacks()

        async def _react_one(persona: dict[str, Any]) -> tuple[str, dict[str, Any]]:
            archetype_id = persona["id"]
            briefing = briefings_by_id.get(archetype_id, {})
            reaction_path = paths.reaction(archetype_id)

            ui_thinking = cbs.on_thinking.get(archetype_id)
            ui_text = cbs.on_reaction_delta.get(archetype_id)

            async def on_event(event_type: str, token: str) -> None:
                append_jsonl(reaction_path, {
                    "event": event_type,
                    "token": token,
                    "ts": utc_now_iso(),
                })
                if event_type == "thinking" and ui_thinking:
                    await ui_thinking(token)
                elif event_type == "tool_delta" and ui_text:
                    await ui_text(token)

            reaction = await stream_archetype(
                self._client,
                persona=persona,
                briefing=briefing,
                skill_body=skill_body,
                on_event=on_event,
            )
            append_jsonl(reaction_path, {
                "event": "complete",
                "data": reaction,
                "ts": utc_now_iso(),
            })
            return archetype_id, reaction

        results = await asyncio.gather(*[_react_one(p) for p in self._personas])
        reactions = dict(results)

        state = self._load_state(run_id)
        state["status"] = "reacted"
        state["updated_at"] = utc_now_iso()
        self._save_state(run_id, state)
        return reactions

    async def report(
        self,
        run_id: str,
        on_brief_text: TextCallback = None,
    ) -> str:
        """Run reporter: produce brief.md from all briefings and reactions."""
        paths = self._paths(run_id)
        skill_body = load_skill(self._reporter_skill)

        briefings = [
            read_json(p) for p in sorted(paths.briefings_dir.glob("*.json"))
        ] if paths.briefings_dir.exists() else []

        reactions: dict[str, dict[str, Any]] = {}
        if paths.reactions_dir.exists():
            for p in sorted(paths.reactions_dir.glob("*.jsonl")):
                events = read_jsonl(p)
                complete = next(
                    (e["data"] for e in reversed(events) if e.get("event") == "complete"),
                    None,
                )
                if complete:
                    reactions[p.stem] = complete

        brief_text = await stream_reporter(
            self._client,
            briefings=briefings,
            reactions=reactions,
            skill_body=skill_body,
            on_text=on_brief_text,
        )
        paths.brief.write_text(brief_text, encoding="utf-8")

        state = self._load_state(run_id)
        state["status"] = "completed"
        state["updated_at"] = utc_now_iso()
        self._save_state(run_id, state)
        return brief_text

    async def run_pipeline(
        self,
        run_id: str,
        callbacks: RunCallbacks | None = None,
    ) -> dict[str, Any]:
        """Full pipeline: brief → react_parallel → report. Returns summary dict."""
        cbs = callbacks or RunCallbacks()
        briefings = await self.brief(run_id, on_supervisor_text=cbs.on_supervisor_text)
        reactions = await self.react_parallel(run_id, callbacks=cbs)
        brief_text = await self.report(run_id, on_brief_text=cbs.on_brief_text)
        return {
            "run_id": run_id,
            "briefings": briefings,
            "reactions": reactions,
            "brief_length": len(brief_text),
        }

    def status(self, run_id: str) -> dict[str, Any]:
        """Return a summary of current run state."""
        state = self._load_state(run_id)
        paths = self._paths(run_id)
        return {
            "run_id": run_id,
            "status": state["status"],
            "scenario": state.get("scenario_path"),
            "briefings": len(list(paths.briefings_dir.glob("*.json"))) if paths.briefings_dir.exists() else 0,
            "reactions": len(list(paths.reactions_dir.glob("*.jsonl"))) if paths.reactions_dir.exists() else 0,
            "brief_exists": paths.brief.exists(),
            "validation_exists": paths.validation.exists(),
            "created_at": state.get("created_at"),
            "updated_at": state.get("updated_at"),
        }
