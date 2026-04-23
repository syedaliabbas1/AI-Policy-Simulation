# policy-sim — Frontend + API Task List

**Session start:** 2026-04-23 (Day 3 of 5)
**Remaining deadline:** Apr 26–27 submission, Apr 28 live finals
**Current state:** Days 1–2 complete. Engine, streaming, CLI, replay, validation, Streamlit all done. 6 completed runs in simulation_runs/.

---

## Day 3 — FastAPI layer + Vite scaffold

### Stage 0 gate (code-side, user runs cloud verification)
- [ ] Add smoke SSE endpoint to `api/main.py` for buffering test
- [ ] Azure `/home` env var: `os.getenv("SIMULATION_RUNS_ROOT", "/home/simulation_runs")`
- [ ] Auth middleware: `X-POLICY-SIM-KEY` header enforcement
- [ ] Sentry: `sentry_sdk.init(...)` + `/api/debug/boom` test endpoint
- [ ] USER ACTION: Deploy to Azure App Service, verify SSE unbuffered through Vercel rewrite

### Engine modification
- [x] `simulation/engine.py` — `RunCallbacks` exists (on_supervisor_text, on_thinking, on_reaction_delta, on_brief_text)
- [ ] Add `on_reaction_complete: dict[str, Callable]` to `RunCallbacks` + wire in `react_parallel`

### FastAPI layer (`api/`)
- [ ] `api/__init__.py`
- [ ] `api/auth.py` — X-POLICY-SIM-KEY middleware
- [ ] `api/scenarios.py` — list knowledge_base/fiscal/*.md files
- [ ] `api/stream.py` — engine callbacks → SSE frames (sse-starlette EventSourceResponse)
- [ ] `api/main.py` — all routes per FRONTEND-PLAN SSE schema:
  - POST /api/runs → { run_id }
  - GET /api/runs/:id/stream → SSE
  - GET /api/runs/:id/replay?delay_ms=N → SSE replay
  - GET /api/runs/:id/brief → brief.md content
  - GET /api/runs/:id/validation → validation.json
  - GET /api/runs/:id/audio/:archetype.mp3 → static (MEDIA-PLAN v1 hook)
  - GET /api/scenarios → list of .md files
  - GET /api/health → 200
  - GET /api/smoke → 20 SSE ticks for buffering test
  - GET /api/debug/boom → raises for Sentry test

### Vite scaffold (`web/`)
- [ ] `pnpm create vite web --template react-ts`
- [ ] Add tailwind, shadcn init, `@tremor/react`
- [ ] shadcn components: card, button, badge, progress, input, select, dialog, separator, tabs, slider
- [ ] `web/vite.config.ts` — proxy /api/* → localhost:8000
- [ ] `web/tailwind.config.ts` — Tremor plugin wired
- [ ] `web/src/lib/api.ts` — fetch wrappers with X-POLICY-SIM-KEY header
- [ ] `web/src/lib/sseClient.ts` — fetch+ReadableStream SSE reader, typed events
- [ ] `web/src/hooks/useRunStream.ts` — reducer keyed by archetype_id
- [ ] `web/src/components/ArchetypeCard.tsx` (Sarah vertical slice first)
- [ ] `web/src/components/PolicyInput.tsx`
- [ ] `web/src/components/SupervisorBriefing.tsx`
- [ ] `web/src/components/BriefDisplay.tsx`
- [ ] `web/src/components/ValidationPanel.tsx`
- [ ] `web/src/App.tsx` — 2×2 grid + banner + brief/validation footer

### Deploy config
- [ ] `startup.sh` — gunicorn/uvicorn boot for Azure
- [ ] `vercel.json` — rewrite /api/* → Azure URL + build/install commands
- [ ] `.github/workflows/azure-deploy.yml` — Python 3.11 → Azure App Service on push to main

### Requirements update
- [ ] Add to `requirements.txt`: `fastapi`, `uvicorn[standard]`, `sse-starlette`, `sentry-sdk[fastapi]`

---

## Day 4 — Polish + media + deploy + video

- [ ] All 4 archetype cards in 2×2 grid
- [ ] SupervisorBriefing banner (collapses after supervisor_done)
- [ ] BriefDisplay — streaming markdown + Tremor BarList
- [ ] ValidationPanel — Tremor Callout + Badge
- [ ] PolicyInput — scenario dropdown, Live/Replay toggle, Run
- [ ] Portrait img per ArchetypeCard (MEDIA-PLAN v1, [CUT:4])
- [ ] Audio player + CSS pulse + SRT caption ([CUT:3])
- [ ] Thinking translucent overlay ([CUT:3])
- [ ] Reporter narration audio ([CUT:2])
- [ ] v2 lip-sync MP4 (stretch/[CUT:1])
- [ ] Production deploy: GitHub Actions → Azure + Vercel CLI + policysim.tech DNS
- [ ] .claude/agents/ subagent wrappers (supervisor.md, archetype.md, reporter.md)
- [ ] README (funder-facing pitch)
- [ ] docs/video-storyboard.md
- [ ] 100–200 word submission summary

---

## Day 5 — Video + submission
- [ ] Record 3-min demo against --replay on new frontend
- [ ] Submission upload

---

## Notes / blockers

- Cloud accounts needed for Stage 0 gate: Azure App Service, Vercel, Sentry (all via GitHub Education Pack)
- policysim.tech domain registration via .TECH Domains Pack perk
- Azure fallback: Railway (30-day trial) if Stage 0 SSE buffering fails by Day 3 afternoon
