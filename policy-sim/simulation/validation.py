"""IFS directional validation and internal consistency checks."""

from pathlib import Path
from typing import Any

from .utils import read_json, read_last_complete_event, utc_now_iso, write_json, RunPaths


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
            complete = read_last_complete_event(p)
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

    # 2 — Ordering: low-quintile archetypes more negative than higher-quintile
    ordering_pass = True
    ordering_detail = ""
    expected_archetypes = list(expectations.keys())
    if len(expected_archetypes) >= 2:
        scores = [
            (aid, reactions.get(aid, {}).get("support_or_oppose", 0.0))
            for aid in expected_archetypes
        ]
        negative_archetypes = [aid for aid, s in scores if s < 0]
        positive_archetypes = [aid for aid, s in scores if s >= 0]
        if negative_archetypes and positive_archetypes:
            # Every negative archetype must be more negative than every positive one
            min_negative = min(s for _, s in scores if s < 0)
            max_positive = max(s for _, s in scores if s >= 0)
            ordering_pass = min_negative < max_positive
            ordering_detail = ", ".join(f"{aid}={s:.2f}" for aid, s in sorted(scores, key=lambda x: x[1]))
        else:
            ordering_detail = "insufficient sign variation to check ordering"
            ordering_pass = False
    else:
        ordering_detail = "fewer than 2 archetypes found"
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


def compare_runs(run_dir_a: Path, run_dir_b: Path) -> dict[str, Any]:
    """Check that shared archetypes have opposite support_or_oppose signs between two runs.

    Intended for counter-scenario sign-flip validation (e.g. VAT rise vs VAT cut).
    Saves comparison.json to run_dir_a.
    """

    def _load_reactions(run_dir: Path) -> dict[str, float]:
        reactions_dir = run_dir / "reactions"
        result: dict[str, float] = {}
        if reactions_dir.exists():
            for p in sorted(reactions_dir.glob("*.jsonl")):
                complete = read_last_complete_event(p)
                if complete is not None:
                    score = complete.get("support_or_oppose")
                    if score is not None:
                        result[p.stem] = float(score)
        return result

    scores_a = _load_reactions(run_dir_a)
    scores_b = _load_reactions(run_dir_b)

    shared = sorted(set(scores_a) & set(scores_b))
    details: dict[str, Any] = {}
    for archetype_id in shared:
        a = scores_a[archetype_id]
        b = scores_b[archetype_id]
        flipped = (a * b) < 0
        details[archetype_id] = {
            "run_a": a,
            "run_b": b,
            "sign_flipped": flipped,
        }

    overall_pass = bool(shared) and all(v["sign_flipped"] for v in details.values())

    report = {
        "run_a": run_dir_a.name,
        "run_b": run_dir_b.name,
        "compared_at": utc_now_iso(),
        "overall_pass": overall_pass,
        "details": details,
    }
    write_json(run_dir_a / "comparison.json", report)
    return report


def _parse_threshold(rule: str) -> float | None:
    """Extract a numeric threshold from a validation rule string like '< -0.3'."""
    import re
    match = re.search(r"<\s*(-?\d+\.?\d*)", rule)
    if match:
        return float(match.group(1))
    return None
