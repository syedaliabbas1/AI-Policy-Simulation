"""List available policy scenario files and their metadata."""

from pathlib import Path

_KB_DIR = Path(__file__).parent.parent / "knowledge_base" / "fiscal"
_REGISTER_PATH = _KB_DIR / "policy_register.json"


def _load_register() -> dict:
    import json
    if _REGISTER_PATH.exists():
        with _REGISTER_PATH.open() as f:
            return json.load(f)
    return {"policies": []}


def list_policies() -> list[dict]:
    """Return all registered policies with their metadata."""
    register = _load_register()
    return register.get("policies", [])


def get_policy(policy_id: str) -> dict | None:
    """Return metadata for a specific policy, or None if not found."""
    for policy in _load_register().get("policies", []):
        if policy["id"] == policy_id:
            return policy
    return None


def list_scenarios() -> list[dict]:
    """Return scenario files from the register (fallback to glob if no register)."""
    register = _load_register()
    if register.get("policies"):
        return [
            {
                "name": p["id"],
                "path": str(_KB_DIR.parent.parent / p["scenario_path"]),
                "label": p["label"],
                "policy_id": p["id"],
            }
            for p in register["policies"]
        ]
    # Fallback: list all .md files as before
    return [
        {"name": p.stem, "path": str(p), "label": p.stem.replace("_", " ").title()}
        for p in sorted(_KB_DIR.glob("*.md"))
    ]


def get_archetypes_for_policy(policy_id: str) -> list[str] | None:
    """Return the list of archetype IDs configured for a policy, or None if policy not found."""
    policy = get_policy(policy_id)
    return policy.get("archetype_ids") if policy else None
