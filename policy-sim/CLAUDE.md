# policy-sim

AI-driven UK fiscal policy simulation platform. Ingests a policy document, streams parallel reasoning from four population archetypes via Claude claude-opus-4-7 with extended thinking, and outputs a synthesised policy brief validated against IFS distributional findings.

## Primary runtime

```
cd policy-sim
uv pip install -r requirements.txt
cp .env.example .env  # add your ANTHROPIC_API_KEY
uv run streamlit run app/main.py
```

## CLI runtime

```
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

## Architecture

Supervisor → 4 parallel archetype calls (asyncio.gather) → reporter. Each call is an isolated `anthropic.messages.stream()` context. See `../IMPLEMENTATION-PLAN.md` for full spec.

## Key files

- `.claude/skills/*/SKILL.md` — system prompts loaded at runtime by Python (single source of truth)
- `data/archetypes/*.json` — persona definitions
- `knowledge_base/fiscal/` — policy document, background, IFS validation data
- `simulation/engine.py` — SimulationEngine
- `simulation/streaming.py` — SDK wrapper (extended thinking + tool use + prompt caching)
- `app/main.py` — Streamlit entry point

## Model

Use `claude-opus-4-7` for all archetype, supervisor, and reporter calls. Extended thinking is enabled on archetype calls. Do not downgrade to Sonnet for archetype calls — thinking quality is a judging criterion.

## Rules

- No emojis anywhere in code or docs
- No attribution comments on commits
- Do not edit archived docs in `docs/archive/`
- `simulation_runs/` is gitignored — never commit run artifacts
- Do not add dependencies beyond `requirements.txt` without checking with the user

## Session hygiene

- **Proactive context compaction**: Don't wait until context is nearly full. Compact mid-session before quality degrades — especially during long frontend/backend build sessions.
