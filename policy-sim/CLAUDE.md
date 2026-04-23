# policy-sim

AI-driven UK fiscal policy simulation platform. Ingests a policy document, streams parallel reasoning from four population archetypes via Claude claude-opus-4-7 with extended thinking, and outputs a synthesised policy brief validated against IFS distributional findings.

## Primary runtime

```
# Full stack (API + frontend together):
cd policy-sim/web && bun run dev:full

# Backend only:
cd policy-sim && uv run uvicorn api.main:app --port 8000

# Streamlit fallback:
cd policy-sim && uv run streamlit run app/main.py
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

## Frontend

- `web/` — Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn Base UI (Nova/Geist)
- `api/` — FastAPI + sse-starlette wrapping SimulationEngine
- SSE events flow: EventSource at `GET /api/runs/:id/stream` or `/replay`

## Key files

- `.claude/skills/*/SKILL.md` — system prompts loaded at runtime by Python (single source of truth)
- `data/archetypes/*.json` — persona definitions
- `knowledge_base/fiscal/` — policy document, background, IFS validation data
- `simulation/engine.py` — SimulationEngine
- `simulation/streaming.py` — SDK wrapper (extended thinking + tool use + prompt caching)
- `api/main.py` — FastAPI routes
- `api/stream.py` — asyncio.Queue SSE generator
- `web/src/hooks/useRunStream.ts` — SSE reducer keyed by archetype_id
- `web/src/lib/sseClient.ts` — native EventSource client
- `web/src/components/PolicyInput.tsx` — update DEMO_RUN_ID after next live run

## Model

Use `claude-opus-4-7` for all archetype, supervisor, and reporter calls. Extended thinking is enabled on archetype calls. Do not downgrade to Sonnet for archetype calls — thinking quality is a judging criterion.

## SSE / streaming gotchas

- **Use native `EventSource`, never `fetch+ReadableStream`** — browsers buffer fetch bodies; EventSource streams immediately
- Auth key passed as `?key=` query param (EventSource cannot set custom headers); header `X-POLICY-SIM-KEY` also accepted
- `client.beta.messages.stream` required for archetype calls (not `client.messages.stream`)
- `thinking={"type":"enabled"}` returns 400 for `claude-opus-4-7`; use `thinking={"type":"adaptive"}, output_config={"effort":"max"}`
- Opus 4.7 thinking is **redacted** — encrypted signature only, no visible text; emit synthetic placeholder on `content_block_start` with type `thinking`/`redacted_thinking`

## shadcn / Tailwind v4 gotchas

- Use `--base base` flag for Base UI: `bunx --bun shadcn@latest init --template vite --base base --preset nova --yes`
- Root `tsconfig.json` needs `baseUrl`+`paths` for shadcn alias detection (not just `tsconfig.app.json`)
- Google Fonts `@import` must go in `index.html` as `<link>` — PostCSS rejects `@import url()` after other CSS imports
- Remove `<StrictMode>` in development — double-invokes effects, causes double SSE connections

## Rules

- No emojis anywhere in code or docs
- No attribution comments on commits
- Do not edit archived docs in `docs/archive/`
- `simulation_runs/` is gitignored — never commit run artifacts
- Do not add dependencies beyond `requirements.txt` without checking with the user
- Use `bun` for all JS package management (not npm/pnpm/yarn)

## Session hygiene

- **Proactive context compaction**: Don't wait until context is nearly full. Compact mid-session before quality degrades — especially during long frontend/backend build sessions.
