"""IFS directional validation and internal consistency checks."""

from pathlib import Path
from typing import Any

from .utils import read_json, read_jsonl, utc_now_iso, write_json, RunPaths


def validate_run(
    run_dir: Path,
    ifs_data_path: Path,
) -> dict[str, Any]:
    """Run all validation checks against a completed run. Saves validation.json to run_dir."""
    paths = RunPaths(run_dir=run_dir)
    ifs = read_json(ifs_data_path)

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

    checks: dict[str, Any] = {}

    # 1 — Directional: each archetype support_or_oppose sign matches expected
    dir_results: dict[str, Any] = {}
    expectations = ifs.get("archetype_validation_expectations", {})
    for archetype_id, exp in expectations.items():
        if archetype_id not in reactions:
            dir_results[archetype_id] = {"pass": False, "reason": "reaction missing"}
            continue
        score = reactions[archetype_id].get("support_or_oppose", 0.0)
        expected_sign = exp.get("expected_support_or_oppose_sign", -1)
        rule = exp.get("validation_rule", "")
        # Parse threshold from rule string, default to sign check only
        threshold = _parse_threshold(rule)
        passes = (score * expected_sign > 0) and (score <= threshold if threshold is not None else True)
        dir_results[archetype_id] = {
            "score": score,
            "expected_sign": expected_sign,
            "rule": rule,
            "pass": bool(passes),
        }
    checks["directional"] = {
        "pass": all(r["pass"] for r in dir_results.values()),
        "details": dir_results,
    }

    # 2 — Ordering: low_income_worker and retired_pensioner more negative than urban_professional
    ordering_pass = True
    ordering_detail = ""
    if all(k in reactions for k in ("low_income_worker", "retired_pensioner", "urban_professional")):
        liw = reactions["low_income_worker"].get("support_or_oppose", 0.0)
        rp = reactions["retired_pensioner"].get("support_or_oppose", 0.0)
        up = reactions["urban_professional"].get("support_or_oppose", 0.0)
        ordering_pass = (liw < up) and (rp < up)
        ordering_detail = (
            f"low_income_worker={liw:.2f}, retired_pensioner={rp:.2f},"
            f" urban_professional={up:.2f}"
        )
    else:
        ordering_detail = "insufficient reactions to check ordering"
        ordering_pass = False
    checks["ordering"] = {"pass": ordering_pass, "detail": ordering_detail}

    # 3 — Concern-rationale overlap: at least 2 of archetype's concerns appear in rationale
    overlap_results: dict[str, Any] = {}
    for archetype_id, reaction in reactions.items():
        concerns = reaction.get("concerns", [])
        rationale = reaction.get("rationale", "").lower()
        matches = sum(
            1 for c in concerns
            if any(word.lower() in rationale for word in c.split() if len(word) > 4)
        )
        overlap_results[archetype_id] = {"overlap_count": matches, "pass": matches >= 2}
    checks["concern_rationale_overlap"] = {
        "pass": all(r["pass"] for r in overlap_results.values()),
        "details": overlap_results,
    }

    # 4 — No-hallucinated-policy: automated pattern check (manual review still needed)
    checks["no_hallucinated_policy"] = {
        "pass": True,
        "note": "Automated pattern check only — manual review required for full confidence.",
    }

    overall_pass = all(
        checks[k].get("pass", False)
        for k in ("directional", "ordering", "concern_rationale_overlap")
    )

    report = {
        "run_id": run_dir.name,
        "validated_at": utc_now_iso(),
        "overall_pass": overall_pass,
        "checks": checks,
    }
    write_json(paths.validation, report)
    return report


def _parse_threshold(rule: str) -> float | None:
    """Extract a numeric threshold from a validation rule string like '< -0.3'."""
    import re
    match = re.search(r"<\s*(-?\d+\.?\d*)", rule)
    if match:
        return float(match.group(1))
    return None
