# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**policy-sim/** is an AI-driven UK fiscal policy simulation platform. It ingests a policy document, streams parallel reasoning from four population archetypes via Claude Opus 4.7 with extended thinking, and outputs a synthesised policy brief validated against IFS distributional findings.

**Live demo:** https://ai-policy-simulation.vercel.app

## Build Commands

### Backend (FastAPI)
```bash
cd policy-sim
uv pip install -r requirements.txt
uv run uvicorn api.main:app --port 8000
```

### Frontend (Vite + React)
```bash
cd policy-sim/web
bun install          # or bun (already has node_modules)
bun run dev          # dev server only
bun run build        # production build
```

### Full Stack (concurrent)
```bash
cd policy-sim/web && bun run dev:full
# Runs API on :8000 + frontend on :5173
```

### Streamlit fallback
```bash
cd policy-sim && uv run streamlit run app/main.py
```

### CLI
```bash
cd policy-sim
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

## Architecture

```
Policy document
      │
      v
Supervisor agent (reads policy + all 4 persona JSONs)
      │
      v  4 personalised briefings
      │
      +---> Archetype: Sarah  ---> extended thinking + Reaction tool call
      +---> Archetype: Mark   ---> extended thinking + Reaction tool call
      +---> Archetype: Priya  ---> extended thinking + Reaction tool call
      +---> Archetype: Arthur ---> extended thinking + Reaction tool call
                                               │
                                               v
                                      Reporter agent
                                               │
                                               v
                               Policy brief + IFS validation
```

Each arrow is an isolated `anthropic.messages.stream()` call. Four archetype calls run concurrently via `asyncio.gather()`. Tokens stream directly to the React UI via SSE (`/api/runs/:id/stream`).

**Stack:**
- Backend: FastAPI + sse-starlette, deployed on Azure App Service
- Frontend: Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn, deployed on Vercel
- AI: Claude Opus 4.7 with adaptive extended thinking on all archetype calls
- Voices: edge-tts UK neural voices

## Key Files

| Path | Purpose |
|------|---------|
| `simulation/engine.py` | SimulationEngine orchestrating the full pipeline |
| `simulation/streaming.py` | SDK wrapper (extended thinking + tool use + prompt caching) |
| `simulation/cli.py` | init/run/report/replay CLI commands |
| `simulation/validation.py` | IFS directional-comparison checker |
| `api/main.py` | FastAPI routes |
| `api/stream.py` | asyncio.Queue SSE generator |
| `web/src/hooks/useRunStream.ts` | SSE event reducer |
| `web/src/lib/sseClient.ts` | Native EventSource SSE client |
| `.claude/skills/*/SKILL.md` | System prompts loaded at runtime by Python |

## Important Patterns

### SSE / Streaming
- **Use native `EventSource`, never `fetch+ReadableStream`** — browsers buffer fetch bodies; EventSource streams immediately
- Auth key passed as `?key=` query param (EventSource cannot set custom headers)
- `client.beta.messages.stream` required for archetype calls (not `client.messages.stream`)

### Opus 4.7 Extended Thinking
- `thinking={"type":"adaptive"}` + `output_config={"effort":"high"}` (NOT `thinking={"type":"enabled"}`)
- `tool_choice` must be `"auto"` when thinking is enabled
- Opus 4.7 thinking is **redacted** — encrypted signature only; emit synthetic placeholder on `content_block_start` with type `thinking`/`redacted_thinking`

### Prompt Caching
- SKILL.md files are loaded by Python at runtime as system prompts (single source of truth)
- Persona JSONs and knowledge_base documents are cached

## Project Structure

```
policy-sim/
├── api/                     FastAPI layer (routes, SSE stream, auth)
├── simulation/              Core engine (engine.py, streaming.py, tts.py, validation.py)
├── app/                     Streamlit fallback UI
├── web/                     React frontend (Vite + shadcn)
├── data/archetypes/         Persona JSONs
├── knowledge_base/fiscal/   Policy documents + IFS validation data
├── .claude/skills/          SKILL.md system prompts (runtime-loaded)
└── simulation_runs/         Runtime artifacts (gitignored)
```

## Rules

- No emojis anywhere in code or docs
- No attribution comments on commits
- Do not edit archived docs in `docs/archive/`
- `simulation_runs/` is gitignored — never commit run artifacts
- Do not add dependencies beyond `requirements.txt` without checking
- Use `bun` for all JS package management (not npm/pnpm/yarn)
- Use `uv` for Python package management
- Remove `<StrictMode>` in development — double-invokes effects, causes double SSE connections

## Reference Codebase

`agentic-bo/` is a reference codebase — reuse source from it, do not edit it directly. Key reusable components:
- `simulation/observers/base.py` — Observer ABC (from `agentic-bo/bo_workflow/observers/base.py`)
- `simulation/utils.py` — RunPaths, JSON I/O helpers (from `agentic-bo/bo_workflow/utils.py`)
- `simulation/engine.py` — adapted from `BOEngine` class in `agentic-bo/bo_workflow/engine.py`

## Deployment

| Component | Service |
|-----------|---------|
| Backend API | Azure App Service |
| Frontend | Vercel |
| Auth | Shared-secret `X-POLICY-SIM-KEY` header or `?key=` query param |

### Demo Run Management
- `DEMO_RUN_ID` in `web/src/components/PolicyInput.tsx:11` must match a run present in `/home/simulation_runs/` on Azure prod
- To upload a local run to Azure: zip it, PUT to Kudu VFS `/api/vfs/tmp/<name>.zip`, then unzip via command API:
  ```powershell
  # Upload (use PowerShell — curl --data-binary fails on Windows for binary)
  Invoke-WebRequest -Uri "https://policy-sim.scm.azurewebsites.net/api/vfs/tmp/<run>.zip" -Method PUT -Headers @{Authorization="Basic <b64cred>"} -Body ([IO.File]::ReadAllBytes("<path>.zip"))
  ```
  ```bash
  # Then unzip via Kudu command API
  curl -X POST -u '$policy-sim:<pwd>' https://policy-sim.scm.azurewebsites.net/api/command \
    -H "Content-Type: application/json" \
    -d '{"command":"unzip -o /home/tmp/<run>.zip -d /home/simulation_runs/","dir":"/"}'
  ```
- Kudu command API does not support shell operators (`&&`, `||`, `echo X`) — one command per request
- Kudu VFS path `/api/vfs/tmp/` maps to `/home/tmp/` on the container
- Get Kudu credentials: `az webapp deployment list-publishing-credentials --name policy-sim --resource-group policy-sim-rg`
