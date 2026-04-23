"""List available policy scenario files."""

from pathlib import Path

_KB_DIR = Path(__file__).parent.parent / "knowledge_base" / "fiscal"


def list_scenarios() -> list[dict]:
    return [
        {"name": p.stem, "path": str(p), "label": p.stem.replace("_", " ").title()}
        for p in sorted(_KB_DIR.glob("*.md"))
    ]
