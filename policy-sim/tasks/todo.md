# policy-sim — Task Status

**Last updated:** 2026-04-23 (end of Day 3)
**Submission deadline:** Apr 26–27, live finals Apr 28
**Live URL:** https://ai-policy-simulation.vercel.app

---

## Done (Days 1–3)

### Foundation
- [x] policy-sim/ tree, requirements.txt, .env.example, .gitignore
- [x] observers/base.py + utils.py ported from agentic-bo
- [x] Three SKILL.md files (supervisor, archetype, reporter)
- [x] Four archetype JSONs (ONS/IFS-sourced)
- [x] knowledge_base/fiscal/ (uk_vat_2010.md, background_context.md, ifs_2011_validation.json, uk_vat_cut_hypothetical.md)

### Engine + CLI
- [x] simulation/streaming.py — SDK wrapper (extended thinking + tool use + prompt caching)
- [x] simulation/engine.py — SimulationEngine with RunCallbacks
- [x] simulation/cli.py — init/run/report/replay commands
- [x] simulation/replay.py — JSONL rehydration + paced re-emission
- [x] simulation/validation.py — IFS directional + internal consistency checks
- [x] simulation/tts.py — edge-tts synthesis, all 4 archetypes + reporter narration
- [x] End-to-end CLI verified, 6+ completed runs in simulation_runs/

### Streamlit fallback
- [x] app/main.py + all components (agent_card, policy_input, brief_display, validation_panel)

### React frontend
- [x] api/ — FastAPI layer (auth, stream, scenarios, main with all SSE routes)
- [x] web/ — Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn
- [x] web/src/hooks/useRunStream.ts — SSE reducer
- [x] web/src/lib/sseClient.ts — native EventSource client
- [x] web/src/lib/api.ts — fetch wrappers + authUrl() helper
- [x] All 5 components: ArchetypeCard, PolicyInput, SupervisorBriefing, BriefDisplay, ValidationPanel
- [x] App.tsx — 2x2 grid + KPI row + brief/validation footer

### Deploy
- [x] Azure App Service live — policy-sim.azurewebsites.net (health 200, SSE pass)
- [x] Vercel live — ai-policy-simulation.vercel.app (portraits included)
- [x] Vercel root dir = policy-sim/web/ (prevents FastAPI autodetect)
- [x] web/vercel.json — /api/* rewrite to Azure
- [x] Git-connected: push to remote 2 (ossaidqadri/AI-Policy-Simulation) auto-deploys Vercel
- [x] Azure CORS updated to include ai-policy-simulation.vercel.app

### Media + docs
- [x] 4 portraits generated (FLUX.1-schnell) in web/public/portraits/
- [x] scripts/generate_portraits.py committed
- [x] README rewritten as funder-facing pitch
- [x] docs/submission-summary.md updated
- [x] .claude/agents/ — supervisor.md, archetype.md, reporter.md

---

## Remaining (Days 4–5)

### Critical (blocks demo)
- [ ] Add VITE_POLICY_SIM_KEY to Vercel env vars
      → vercel.com → ai-policy-simulation → Settings → Environment Variables
      → same value as Azure POLICY_SIM_KEY
      → redeploy after adding
- [ ] Update docs/submission-summary.md URL from policysim.tech → ai-policy-simulation.vercel.app

### Day 4
- [ ] Record 3-min demo video against --replay on React frontend
      → bun run dev:full from policy-sim/web/
      → pick a run_id from simulation_runs/ (gentle-sparrow-8096 has audio+thinking)
      → use Replay toggle in UI, screen record

### Day 5
- [ ] Final submission upload with live URL + video

### Stretch (cut if time pressure)
- [ ] policysim.tech domain (GitHub Education Pack → .TECH Domains → point DNS to Vercel)
- [ ] v2 lip-sync (Rhubarb + ffmpeg pre-rendered MP4) — MEDIA-PLAN §v2

---

## Key file locations

| What | Where |
|---|---|
| Vercel project config | policy-sim/web/vercel.json |
| Vercel .vercel link | policy-sim/.vercel/project.json (project ID: prj_D30dsGSUy3gcs3Z3q8VIjDUJ2Xju) |
| Azure deploy plan | policy-sim/.azure/deployment-plan.md |
| Portraits | policy-sim/web/public/portraits/ |
| Demo run for replay | simulation_runs/gentle-sparrow-8096/ |
| DEMO_RUN_ID constant | policy-sim/web/src/components/PolicyInput.tsx |
