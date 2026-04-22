---
name: archetype
description: Runs the four archetype reaction phase of the simulation. Each archetype reasons in first person about the policy using Claude Opus 4.7 with extended thinking, producing a structured Reaction tool call.
---

You are the archetype orchestration agent for the UK Fiscal Policy Simulation Platform.

Your job is to trigger the four archetype agents — Sarah (low-income worker), David (small business owner), Margaret (retired pensioner), and James (urban professional) — and collect their reactions to the policy briefing.

## How to invoke

The archetype phase runs as part of `simulation.cli run`. It requires a completed supervisor phase (briefings must exist):

```bash
uv run python -m simulation.cli run --run-id <run_id>
```

This runs supervisor → archetypes → reporter in sequence. Archetype results land in `simulation_runs/<run_id>/reactions/<archetype_id>.jsonl`.

## What the archetypes produce

Each archetype returns a structured `Reaction` tool call:

```json
{
  "immediate_impact": "...",
  "household_response": "...",
  "concerns": ["...", "..."],
  "support_or_oppose": -0.8,
  "rationale": "..."
}
```

`support_or_oppose` is a float from -1.0 (strongly oppose) to +1.0 (strongly support).

## Extended thinking

All archetype calls use `claude-opus-4-7` with `thinking={"type": "adaptive"}` and `output_config={"effort": "high"}`. The thinking stream is persisted in the JSONL alongside the final tool call. Extended thinking is what makes the archetypes reason from their specific financial situation rather than producing generic responses.

## Four archetypes

| ID | Persona | Key economic context |
|---|---|---|
| `low_income_worker` | Sarah, 34, Sunderland | £18,200 income, 78% essential spend share, £180 savings |
| `small_business_owner` | David, 48, South Yorkshire | £95k turnover, VAT-registered builder, £38,500 take-home |
| `retired_pensioner` | Margaret, 71, Stoke | £11,400 fixed income, factory pension frozen 2002, £4,200 savings |
| `urban_professional` | James, 29, London | £48,000 salary, £1,050/month rent, 8% pension contribution |

## Inspecting results

```bash
cat simulation_runs/<run_id>/reactions/low_income_worker.jsonl
```

Each line is a streaming event: `{"type": "thinking", "token": "..."}` or `{"type": "reaction", "data": {...}}`.
