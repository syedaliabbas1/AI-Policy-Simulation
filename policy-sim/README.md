# UK Fiscal Policy Simulation Platform

Ingests a UK government policy document and streams parallel reasoning from four demographically-grounded population archetypes via **Claude Opus 4.7 with extended thinking**. Produces a synthesised policy brief validated against IFS distributional findings.

Built for the Anthropic Hackathon (April 2026).

---

## What it does

1. **Supervisor** reads the policy document and writes a personalised briefing for each archetype — concrete numbers, what they would care about, what they might misread.
2. **Four archetypes** reason in parallel with extended thinking enabled. Each is a specific person: Sarah (34, care worker, Sunderland), Margaret (71, retired pensioner, Stoke), David (48, builder, South Yorkshire), James (29, urban professional, London). They react in first person, grounded in their income, rent, savings, and concerns.
3. **Reporter** aggregates the four reactions into a structured policy brief: distributional impact, key concerns by group, five concrete recommendations, and a simulation boundary statement.
4. **IFS validation** checks the brief against published distributional findings: directional sign, income ordering, concern-rationale overlap, no hallucinated policy content.

---

## Quickstart

```bash
cd policy-sim
cp .env.example .env          # add ANTHROPIC_API_KEY
uv pip install -r requirements.txt
uv run streamlit run app/main.py
```

Open http://localhost:8501. Select a scenario, click **Run Simulation**.

---

## CLI

```bash
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

---

## Architecture

```
knowledge_base/fiscal/<scenario>.md
        |
        v
  [Supervisor] — claude-opus-4-7, prompt caching
        |
   4x personalised briefings
        |
        +--------+--------+--------+
        v        v        v        v
  [Sarah]  [Margaret]  [David]  [James]
  archetype archetype archetype archetype
  extended  extended  extended  extended
  thinking  thinking  thinking  thinking
        +--------+--------+--------+
        |
   4x reactions (streamed, persisted as JSONL)
        |
        v
  [Reporter] — claude-opus-4-7
        |
   brief.md + validation.json
```

Each archetype call uses `thinking={"type": "adaptive"}` with `output_config={"effort": "high"}`. The four calls run concurrently via `asyncio.gather`. All run artifacts are persisted to `simulation_runs/<run-id>/` for replay.

---

## Project layout

```
policy-sim/
  app/
    main.py                        # Streamlit entry point
    components/
      agent_card.py                # archetype card with stance badge
      brief_display.py             # markdown brief + Altair bar chart
      policy_input.py              # scenario picker + live/replay toggle
      validation_panel.py          # IFS pass/fail badges
  data/
    archetypes/                    # persona JSON files (ONS/IFS grounded)
  knowledge_base/
    fiscal/
      uk_vat_2010.md               # primary scenario (2010 VAT 17.5→20%)
      uk_vat_cut_hypothetical.md   # counterfactual scenario
      background_context.md        # IFS distributional context
      ifs_2011_validation.json     # validation anchors
  simulation/
    engine.py                      # SimulationEngine orchestrator
    streaming.py                   # SDK wrapper (extended thinking, tool use)
    caching.py                     # prompt caching helpers
    replay.py                      # JSONL replay from persisted runs
    validation.py                  # IFS directional validation
    cli.py                         # CLI entry point
  .claude/
    skills/
      supervisor-agent/SKILL.md    # supervisor system prompt
      archetype-agent/SKILL.md     # archetype system prompt
      reporting-agent/SKILL.md     # reporter system prompt
  simulation_runs/                 # persisted run artifacts (gitignored)
```

---

## Data sources

Archetype personas are grounded in:
- **ONS Family Resources Survey 2010/11** — income, household structure, spend shares
- **IFS "The distributional effects of the 2010 spending review" (2011)** — net income loss by quintile, VAT incidence findings
- **National Statistics** — regional rents (North East, Stoke, South Yorkshire, London), NMW April 2010

Validation checks archetype reactions against IFS findings: all archetypes net-negative, low-income > pensioner > urban professional loss ordering, IFS concerns cited in rationale, no invented policy content.

---

## Scenarios

| File | Description |
|---|---|
| `uk_vat_2010.md` | VAT 17.5% → 20%, 4 January 2011. Coalition's lead revenue measure, ~£13bn/yr by 2014/15. |
| `uk_vat_cut_hypothetical.md` | Hypothetical VAT cut from 20% → 15%. Counterfactual for comparison. |

---

## Model

All calls use `claude-opus-4-7`. Extended thinking is enabled on all archetype calls. Do not substitute Sonnet — thinking quality is a judging criterion and the distributional precision of the brief degrades without it.

---

## Replay mode

Every live run persists token-level JSONL events to `simulation_runs/<run-id>/reactions/`. Replay mode re-streams these events with configurable delay (default 15ms/token), allowing demos without API calls.
