# UK Fiscal Policy Simulation Platform

Ingests a UK government policy document and streams parallel reasoning from four demographically-grounded population archetypes via **Claude Opus 4.7 with extended thinking**. Produces a synthesised policy brief validated against IFS distributional findings.

Built for the Anthropic Hackathon (April 2026).

---

## What it does

1. **Supervisor** reads the policy document and writes a personalised briefing for each archetype — concrete numbers, what they care about, what they might misread.
2. **Four archetypes** reason in parallel with extended thinking enabled. Each is a specific person: Sarah (34, care worker, Sunderland), Arthur (72, retired factory worker, Stoke-on-Trent), Mark (48, self-employed builder, South Yorkshire), Priya (31, financial analyst, Islington). They react in first person, grounded in their income, rent, savings, and concerns.
3. **Reporter** aggregates the four reactions into a structured policy brief: distributional impact, key concerns by group, five concrete recommendations, and a simulation boundary statement.
4. **IFS validation** checks the brief against published distributional findings: directional sign, income ordering, concern-rationale overlap, no hallucinated policy content.

---

## Quickstart — Web UI (primary)

```bash
cd policy-sim/web
cp ../.env.example ../.env          # add ANTHROPIC_API_KEY
bun install
bun run dev:full                    # starts FastAPI on :8000 + Vite on :5173
```

Open http://localhost:5173. Select a scenario, choose Live or Replay, click **Run**.

## Quickstart — CLI

```bash
cd policy-sim
cp .env.example .env                # add ANTHROPIC_API_KEY
uv pip install -r requirements.txt
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

## Fallback — Streamlit

```bash
cd policy-sim
uv run streamlit run app/main.py
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
  [Sarah]  [Arthur]  [Mark]  [Priya]
  archetype archetype archetype archetype
  extended  extended  extended  extended
  thinking  thinking  thinking  thinking
        +--------+--------+--------+
        |
   4x reactions (streamed via SSE, persisted as JSONL)
        |
        v
  [Reporter] — claude-opus-4-7
        |
   brief.md + validation.json
```

Each archetype call uses `thinking={"type":"adaptive"}` with `output_config={"effort":"max"}` via `client.beta.messages.stream`. The four calls run concurrently via `asyncio.gather`. All run artifacts persist to `simulation_runs/<run-id>/` for replay.

The web UI streams via native `EventSource` (SSE). The FastAPI layer wraps the same `SimulationEngine` that the CLI uses.

---

## Project layout

```
policy-sim/
  api/
    main.py                        # FastAPI routes (SSE, replay, audio)
    stream.py                      # asyncio.Queue SSE generator
    auth.py                        # shared-secret API key middleware
  web/
    src/
      components/                  # React UI components
      hooks/useRunStream.ts        # SSE reducer + async generator
      lib/sseClient.ts             # native EventSource wrapper
  app/
    main.py                        # Streamlit fallback
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
    agents/
      supervisor.md                # Claude Code subagent wrapper
      archetype.md
      reporter.md
  data/archetypes/                 # persona JSON files (ONS/IFS grounded)
  knowledge_base/fiscal/           # policy scenarios + IFS validation anchors
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
| `uk_vat_cut_hypothetical.md` | Hypothetical VAT cut from 20% → 15%. Counterfactual for sign-flip validation. |

---

## Model

All calls use `claude-opus-4-7`. Extended thinking is enabled on all archetype calls with `output_config={"effort":"max"}`. Do not substitute Sonnet — thinking quality is a judging criterion and the distributional precision of the brief degrades without it.

---

## Replay mode

Every live run persists token-level JSONL events to `simulation_runs/<run-id>/reactions/`. Replay mode re-streams these events with configurable delay (default 30ms/token), allowing demos without API calls. The web UI's **Replay** toggle uses a fixed `DEMO_RUN_ID` defined in `web/src/components/PolicyInput.tsx`.
