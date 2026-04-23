"""Shared utility helpers for run state, serialization, and naming."""

from dataclasses import dataclass
from datetime import UTC, datetime
import json
from pathlib import Path
import secrets
from typing import Any


_RUN_ADJECTIVES = (
    "amber", "brisk", "crisp", "daring", "eager", "fuzzy",
    "gentle", "jolly", "lively", "nimble", "rapid", "steady",
    "sunny", "vivid",
)

_RUN_NOUNS = (
    "otter", "falcon", "heron", "lynx", "fox", "orca",
    "panda", "sparrow", "badger", "koala", "wolf", "tiger",
    "eagle", "whale",
)


@dataclass(frozen=True)
class RunPaths:
    """Canonical file locations under a simulation run directory."""

    run_dir: Path

    @property
    def state(self) -> Path:
        return self.run_dir / "state.json"

    @property
    def briefings_dir(self) -> Path:
        return self.run_dir / "briefings"

    @property
    def reactions_dir(self) -> Path:
        return self.run_dir / "reactions"

    def briefing(self, archetype_id: str) -> Path:
        return self.run_dir / "briefings" / f"{archetype_id}.json"

    def reaction(self, archetype_id: str) -> Path:
        return self.run_dir / "reactions" / f"{archetype_id}.jsonl"

    @property
    def brief(self) -> Path:
        return self.run_dir / "brief.md"

    @property
    def validation(self) -> Path:
        return self.run_dir / "validation.json"


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def generate_run_id() -> str:
    """Generate a human-readable run id like `amber-otter-0421`."""
    adjective = secrets.choice(_RUN_ADJECTIVES)
    noun = secrets.choice(_RUN_NOUNS)
    suffix = secrets.randbelow(10000)
    return f"{adjective}-{noun}-{suffix:04d}"


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True))
        handle.write("\n")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def read_last_complete_event(path: Path) -> dict[str, Any] | None:
    """Return the data from the last event with event=="complete" in a JSONL file, or None."""
    rows = read_jsonl(path)
    return next(
        (r["data"] for r in reversed(rows) if r.get("event") == "complete"),
        None,
    )


def to_python_scalar(value: Any) -> Any:
    """Recursively convert nested structures to plain Python types."""
    if isinstance(value, dict):
        return {str(key): to_python_scalar(inner) for key, inner in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_python_scalar(item) for item in value]
    return value
