# Frontend Replacement Plan — Vite + React + FastAPI on Azure/Vercel

**Status:** approved 2026-04-23 (Day 2 of 5). Implementation not yet started. Written for Sonnet execution with Opus 4.7 available via `advisor()`.
**Scope:** replace the Streamlit UI with a polished industry-standard dashboard; keep Streamlit as fallback; deploy on GitHub Education Pack services.
**Parent plans:**
- `../IMPLEMENTATION-PLAN.md` — whole-project source of truth; read it first.
- `./MEDIA-PLAN.md` — voices, portraits, focus-group UI, deferred lip-sync.

This file is the third plan in the series. It supersedes the "Day 3 — UI" section of the parent IMPLEMENTATION-PLAN (Streamlit primary) while leaving everything below the UI layer unchanged.

---

## For a fresh session picking this up

You are most likely a Sonnet 4.6 session. Opus 4.7 is available via the `advisor()` tool (no parameters — it forwards your full conversation to the stronger reviewer).

1. **Read `../IMPLEMENTATION-PLAN.md` first.** It is whole-project source of truth. Do not re-plan the project.
2. **Read `./MEDIA-PLAN.md` next.** v1 media (portraits + audio + captions) is still authoritative; v2 lip-sync has been promoted from deferred to stretch per §Decisions locked in this file.
3. **Read this file top to bottom.** Do not re-plan the frontend.
4. **Recreate the task list in your session** from §Implementation order. Prior task lists do not transfer.
5. **Check current progress before starting — commands to run:**
   - `ls policy-sim/api/` — does the FastAPI layer exist
   - `ls policy-sim/web/` — does the Vite scaffold exist
   - `cat policy-sim/vercel.json 2>/dev/null` — is the Vercel rewrite wired
   - `cat policy-sim/startup.sh 2>/dev/null` — is the Azure startup command committed
   - `ls policy-sim/.github/workflows/azure-deploy.yml 2>/dev/null` — is CI wired
   - `grep -l sentry-sdk policy-sim/api/*.py 2>/dev/null` — is Sentry wired
   - `ls policy-sim/data/archetypes/portraits/ 2>/dev/null` — how many MEDIA-PLAN v1 portraits exist
   - `ls policy-sim/simulation_runs/` — what cached runs exist for replay mode
   - `cat policy-sim/simulation/tts.py 2>/dev/null` — is TTS wired
6. **Call `advisor()` at every mandated checkpoint** (see §Advisor checkpoints). Opus 4.7 sees your full conversation.
7. **Follow user's global `CLAUDE.md`:**
   - No emojis anywhere in code or docs
   - No "Generated with Claude" / "Co-Authored-By: Claude" attribution on commits
   - Opinionated recommendations with tradeoffs; ask before assuming direction
   - Review thoroughly before making changes
8. **Ask before any destructive action** (deleting files, force pushes, rebases, overwriting uncommitted work). Streamlit is a load-bearing fallback — never delete `policy-sim/app/` without explicit approval.
9. **Live instructions win** — if the user says something that conflicts with this plan, update the plan file before continuing. Never silently diverge.
10. **Do not re-litigate locked decisions** in §Decisions locked unless the user raises them. Sonnet drift on architecture choices wastes the 4-day runway. When in doubt, call `advisor()`.

If you find yourself wanting to change the stack, deploy target, domain, wire protocol, or auth scheme — stop and call `advisor()` first.

---

## Context

The current Streamlit UI reads as a developer tool. Hackathon is scored 30% Impact + 25% Demo + 20% Depth + 25% Opus 4.7 use — three of the four where aesthetic ceiling matters and Streamlit caps out. A polished Vite + React dashboard raises the ceiling on all three without touching simulation logic. GitHub Education Pack covers deploy, domain, and monitoring.

The engine is already ready for this swap. `SimulationEngine` at `simulation/engine.py` is callback-driven and async-native:
- `run_pipeline(run_id, callbacks)` orchestrates supervisor → 4 parallel archetypes → reporter.
- Callbacks: `on_supervisor_text`, `on_thinking[id]`, `on_reaction_delta[id]`, `on_brief_text`.
- Every event already persists to `simulation_runs/<run_id>/**/*.{json,jsonl}`.

The engine can be wrapped with an SSE HTTP layer and zero engine logic changes. Streamlit (under `policy-sim/app/`) stays in place — demo-video safety net, runnable from the same `uv` environment.

**Outcome:** a Vercel-hosted React dashboard at `policysim.tech` that streams 4 concurrent archetype reasoning cards + supervisor banner + streaming policy brief + IFS validation badges, consuming SSE events from a FastAPI service on Azure App Service that wraps the unchanged Python engine.

---

## Decisions locked (do not revisit without user approval)

| Area | Decision |
|---|---|
| Frontend | Vite 7 + React 19 + TypeScript + Tailwind + shadcn/ui + shadcn Blocks |
| Charts / indicators | `@tremor/react` — user override of advisor's lean; keeps flexibility as chart inventory may grow |
| Initial layout | One-shot v0.dev prompt → copy output → commit → iterate (not wired into build) |
| Backend | FastAPI + uvicorn + `sse-starlette` wrapping existing `SimulationEngine` (unchanged) |
| Backend error tracking | `sentry-sdk[fastapi]`, Sentry via GitHub Education Pack (free 1 year, 50K errors) |
| Wire protocol | Plain named-event SSE (§SSE event schema below) |
| Client SSE transport | `fetch` + `ReadableStream` reader (NOT native `EventSource` — can't set custom headers) |
| Auth | Shared-secret header `X-POLICY-SIM-KEY` — Vite bakes at build; FastAPI middleware enforces |
| Deploy frontend | Vite static → Vercel Hobby (free, non-commercial) |
| Deploy backend | FastAPI → Azure App Service (Linux, Python 3.11, B1 Basic). Pack credit $100 ≈ ~7 months |
| Frontend↔backend link | `vercel.json` rewrite `/api/*` → Azure URL; fallback is direct-to-Azure with CORS |
| Persistent storage | Azure App Service `/home` (backed by Azure Storage, persists across redeploys). Mount `simulation_runs/` → `/home/simulation_runs` |
| Custom domain | `policysim.tech` — 1-year free via GitHub Education Pack `.TECH Domains` |
| Demo video | Record on new frontend in `--replay` mode; Streamlit stays runnable as retake fallback |
| Streamlit | Kept at `policy-sim/app/`, NOT deleted. Re-declared as dev/fallback path |
| `.claude/agents/` secondary runtime | Unchanged — inherit Day 4 item from parent plan |
| Media scope | MEDIA-PLAN v1 unchanged; v2 (lip-sync MP4) promoted from deferred to stretch |

---

## Architecture

```
Browser @ https://policysim.tech  (Vite static on Vercel)
    |
    |  POST /api/runs                      create run  -> { run_id }
    |  GET  /api/runs/<id>/stream          custom fetch + ReadableStream reader (SSE)
    |  GET  /api/runs/<id>/replay          same schema, paced from cached JSONL
    |
    v
Vercel rewrite /api/*  -->  Azure App Service
                                 https://policy-sim.azurewebsites.net
                                     |
                                     v
                          FastAPI + uvicorn + sse-starlette + sentry-sdk
                                     |  wires SimulationEngine callbacks to SSE frames
                                     v
                          SimulationEngine  (unchanged — simulation/engine.py)
                                     |
                                     v
                          /home/simulation_runs/<id>/...
                          (Azure App Service persistent /home mount)
```

**Dev:** terminal 1 `uv run uvicorn api.main:app --port 8000`; terminal 2 `pnpm --dir web dev`. Vite proxies `/api/*` → `:8000`.

---

## SSE event schema (load-bearing — do not invent at implementation time)

Single endpoint `GET /api/runs/<run_id>/stream` returns `text/event-stream`. Event types in emission order:

| `event:` | data payload | when |
|---|---|---|
| `run_started` | `{ run_id, scenario_path, archetype_ids: [...] }` | on connect |
| `supervisor_text` | `{ token }` | each supervisor streaming delta |
| `supervisor_done` | `{ briefings: { <id>: {...} } }` | all 4 briefings ready |
| `thinking` | `{ archetype_id, token }` | each archetype thinking delta (interleaved across 4) |
| `reaction_delta` | `{ archetype_id, token }` | each tool-call JSON delta |
| `reaction_complete` | `{ archetype_id, reaction: {...} }` | per archetype tool-call finalized |
| `brief_text` | `{ token }` | each reporter streaming delta |
| `brief_done` | `{ markdown }` | reporter complete |
| `validation` | `{ directional, internal_consistency, counter_scenario }` | after `validate_run()` |
| `done` | `{}` | final; connection closes |
| `error` | `{ phase, message }` | phase failure; no further events |

`/api/runs/<id>/replay` emits identical schema with `?delay_ms=N` pacing from cached JSONL. This is what the demo video records against.

React reducer at `web/src/hooks/useRunStream.ts` keys off this schema.

---

## File layout

```
policy-sim/
|-- api/                                  (NEW)
|   |-- main.py                           FastAPI app; sentry_sdk.init(); routes
|   |-- auth.py                           X-POLICY-SIM-KEY middleware
|   |-- stream.py                         engine callbacks -> SSE events
|   `-- scenarios.py                      lists available .md files under knowledge_base/
|
|-- web/                                  (NEW)
|   |-- package.json                      vite, react, ts, tailwind, shadcn, @tremor/react
|   |-- vite.config.ts                    server.proxy /api -> localhost:8000
|   |-- tailwind.config.ts                tremor plugin wired
|   |-- tsconfig.json
|   |-- index.html
|   `-- src/
|       |-- main.tsx
|       |-- App.tsx                       2x2 grid + banner + brief/validation footer
|       |-- hooks/useRunStream.ts         fetch+ReadableStream SSE client + reducer
|       |-- components/
|       |   |-- ArchetypeCard.tsx
|       |   |-- PolicyInput.tsx           scenario picker + Live/Replay toggle + Run
|       |   |-- SupervisorBriefing.tsx
|       |   |-- BriefDisplay.tsx          streaming markdown + Tremor BarList
|       |   |-- ValidationPanel.tsx       Tremor Callout / Badge
|       |   `-- ui/                       shadcn components (copied via `shadcn add`)
|       |-- lib/
|       |   |-- api.ts                    fetch wrappers w/ X-POLICY-SIM-KEY header
|       |   `-- sseClient.ts              fetch+ReadableStream SSE reader, typed events
|       `-- styles.css
|
|-- .github/workflows/azure-deploy.yml    (NEW) Python -> Azure App Service on push to main
|-- startup.sh                            (NEW) gunicorn/uvicorn boot command for Azure
|-- vercel.json                           (NEW) rewrite /api/* -> Azure URL
|
|-- simulation/                           UNCHANGED
|-- app/                                  Streamlit kept as fallback
|-- data/ knowledge_base/ .claude/        UNCHANGED
`-- FRONTEND-PLAN.md                      (THIS FILE)
```

---

## Reuse (no rewrites, just imports)

| Engine function | Called from |
|---|---|
| `SimulationEngine.init_run(scenario_path)` — `simulation/engine.py` | `api/main.py` `POST /api/runs` |
| `SimulationEngine.run_pipeline(run_id, callbacks)` — `simulation/engine.py` | `api/stream.py` via `EventSourceResponse` |
| `replay_run(run_id, runs_root, on_event, delay_ms)` — `simulation/replay.py` | `api/main.py` `GET /api/runs/:id/replay` |
| `validate_run(run_dir, ifs_data_path)` — `simulation/validation.py` | emitted as `validation` event after `brief_done` |
| `RunPaths`, `read_json`, `read_jsonl` — `simulation/utils.py` | `api/main.py` static-artifact endpoints |

Audio (MEDIA-PLAN v1): `simulation/tts.py` (not yet created) writes mp3/SRT under `/home/simulation_runs/<id>/audio/`. FastAPI serves as static files at `/api/runs/<id>/audio/<archetype>.mp3`. React `<audio>` consumes directly.

---

## Implementation order — labels `[CUT: N]` where cuttable

### Day 3 morning — de-risk ALL deployables BEFORE UI work

Advisor flagged three failure modes + Azure adds a fourth. These are the must-pass gate.

1. **SSE buffering test end-to-end through Vercel rewrite → Azure App Service.**
   - Azure: deploy FastAPI with `GET /api/smoke` emitting `data: tick {n}\n\n` every 500 ms for 10 s (via `sse-starlette`).
   - App Service settings: `Always On = true`, `WEBSITES_PORT=8000`, startup command via `startup.sh`.
   - Vercel: `vercel.json` rewrite + minimal static page with `fetch('/api/smoke')` + `ReadableStream` reader.
   - **Pass:** DevTools Network shows streaming response, 20 events at ~500 ms each. Not a single lump at 10 s.
   - **Fallback if buffered:** expose Azure URL directly, enable CORS for `policysim.tech` + `*.vercel.app`, browser `fetch`-es Azure directly. Document both paths.

2. **Azure `/home` persistent filesystem proven.**
   - Code: `os.getenv("SIMULATION_RUNS_ROOT", "/home/simulation_runs")` passed to `SimulationEngine(runs_root=...)`.
   - Deploy, write a test file, `az webapp restart`, confirm file survives.
   - **Pass:** redeploy does not wipe `/home/simulation_runs`.

3. **Shared-secret auth wired.**
   - FastAPI middleware rejects any request missing `X-POLICY-SIM-KEY`.
   - Vite reads `VITE_POLICY_SIM_KEY` at build; `lib/api.ts` + `lib/sseClient.ts` inject header.
   - Baked-in decision: use `fetch` + `ReadableStream` for SSE (not native `EventSource`) — only `fetch` can set custom headers.
   - **Pass:** missing/wrong header → 401.

4. **Sentry wired.**
   - `sentry_sdk.init(dsn=..., integrations=[FastApiIntegration()])` in `api/main.py`.
   - GET `/api/debug/boom` raises test exception; confirm it lands in Sentry dashboard.
   - **Pass:** exception visible within ~30 s.

→ **Advisor checkpoint #2** before continuing to afternoon work.

### Day 3 afternoon — FastAPI layer

5. `api/main.py` routes:
   - `POST /api/runs` → `{ run_id }` (calls `SimulationEngine.init_run`)
   - `GET /api/runs/:id/stream` → SSE per schema above
   - `GET /api/runs/:id/replay?delay_ms=N` → SSE replay from cached JSONL
   - `GET /api/runs/:id/brief` → `brief.md` content
   - `GET /api/runs/:id/validation` → `validation.json`
   - `GET /api/runs/:id/audio/:archetype.mp3` → static audio (MEDIA-PLAN v1)
   - `GET /api/scenarios` → list of policy `.md` files under `knowledge_base/fiscal/`
   - `GET /api/health` → `200` for Azure healthcheck
6. `api/stream.py`: adapts `SimulationEngine` callbacks to an async generator yielding SSE frames via `sse-starlette.EventSourceResponse`.
7. Local smoke: `curl -N http://localhost:8000/api/runs/<id>/stream` prints events incrementally.

### Day 3 evening — Vite scaffold + vertical slice (Sarah only)

8. `pnpm create vite web --template react-ts`; `pnpm dlx shadcn@latest init`; Tailwind + Tremor plugin in `tailwind.config.ts`; `pnpm add @tremor/react`.
9. `pnpm dlx shadcn@latest add card button badge progress input select dialog separator tabs slider`.
10. **v0.dev one-shot:** prompt "2×2 focus-group dashboard with 4 persona cards streaming thinking tokens, portrait + name + region badge + support/oppose slider + audio player per card, supervisor banner at top, policy brief footer with Tremor BarList and validation Callouts". Copy output → `web/src/components/`. Commit.
11. `web/src/hooks/useRunStream.ts` — reducer over SSE events; state keyed by `archetype_id`.
12. `ArchetypeCard.tsx` — Sarah's card only. Streams thinking, reaction tokens, final stance.
13. **Pass:** click Run, Sarah's card shows live thinking then reaction. DevTools confirms event stream.

→ **Advisor checkpoint #3** before fanning out to all 4 cards.

### Day 4 morning — fan-out + core polish

14. All 4 cards in 2×2 grid via `App.tsx`.
15. `SupervisorBriefing.tsx` banner during briefing phase; collapses after `supervisor_done`.
16. `BriefDisplay.tsx` — streaming markdown via `react-markdown`; support/oppose via Tremor `BarList`.
17. `ValidationPanel.tsx` — Tremor `Callout` + `Badge` driven by `validation` event.
18. `PolicyInput.tsx` — scenario dropdown (`/api/scenarios`), Live/Replay toggle, Run button.

### Day 4 afternoon — media + deploy

19. `[CUT: 4]` Portrait `<img>` per `ArchetypeCard` (PNGs per MEDIA-PLAN v1).
20. `[CUT: 3]` `<audio>` + CSS pulse during playback; SRT caption below.
21. `[CUT: 3]` Thinking translucent overlay during thinking phase; fades when audio begins.
22. `[CUT: 2]` Reporter narration `<audio>` over `BriefDisplay` (en-GB-RyanNeural).
23. `[CUT: 1]` **v2 stretch:** Rhubarb + ffmpeg pre-rendered MP4; swap `<audio>` for `<video>`. Follows `MEDIA-PLAN.md` §v2.
24. **Production deploy:** GitHub Actions → Azure App Service; Vercel CLI deploy; `.TECH` domain wired to Vercel; end-to-end run through `policysim.tech`.

→ **Advisor checkpoint #4** before recording the demo video.

### Day 5 — video + submission

25. Record 3-min demo against `--replay` on new frontend. Streamlit ready for retakes.
26. Cut any remaining items per order below.
27. README (funder-facing pitch per parent plan); 100–200 word submission summary; submit with `https://policysim.tech`.

→ **Advisor checkpoint #5** before final submission.

---

## Advisor checkpoints (mandatory — do not skip)

Opus 4.7 is available via the `advisor()` tool. Call it at each checkpoint. The advisor sees your full conversation.

| # | When | Why |
|---|---|---|
| 1 | Before writing the first line of code | Pressure-test the approach vs. what this plan says; surface anything that shifted since 2026-04-23 |
| 2 | After Day 3 morning Stage 0 gate passes (SSE, /home, auth, Sentry all green) | Review integration quality before afternoon work multiplies any issues |
| 3 | After Day 3 evening vertical slice (Sarah's card works end-to-end) | Same integration-quality gate as MEDIA-PLAN Phase A — before fan-out |
| 4 | Before recording the demo video (Day 4 afternoon / Day 5 morning) | Catch anything missing against pass criteria; confirm fallback path is still intact |
| 5 | Before final submission | Last gate; confirm README + summary + URL accuracy |

Also call advisor if stuck (errors recurring, approach not converging) — do not keep pushing.

---

## Deploy config

### Azure App Service (backend)

**Tier:** B1 Basic Linux, Python 3.11. Pack $100 credit ≈ ~7 months at $13/mo.

**`startup.sh`** (repo root, committed):
```bash
#!/bin/bash
uv run gunicorn api.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:$PORT \
  --timeout 300 \
  --keep-alive 75
```

**App Service settings (via `az webapp config appsettings set` or portal):**
- `ANTHROPIC_API_KEY` — secret
- `POLICY_SIM_KEY` — shared secret (matches Vite build-time)
- `SENTRY_DSN` — from Sentry Pack signup
- `SIMULATION_RUNS_ROOT=/home/simulation_runs`
- `WEBSITES_PORT=8000`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true` (Oryx installs deps)
- `ALWAYS_ON=true` (no cold starts)

**`.github/workflows/azure-deploy.yml`** (push to main):
- Checkout → set up Python 3.11 → `uv sync` → `az webapp deploy --src-path` as zip
- Uses `AZURE_WEBAPP_PUBLISH_PROFILE` secret from Azure portal

**Persistent storage:** `/home` on App Service Linux is backed by Azure Storage and survives restarts/redeploys.

### Vercel (frontend)

**`vercel.json`** (repo root):
```json
{
  "buildCommand": "pnpm --dir web build",
  "installCommand": "pnpm install --dir web --frozen-lockfile",
  "outputDirectory": "web/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://policy-sim.azurewebsites.net/api/:path*" }
  ]
}
```

Build-time env: `VITE_POLICY_SIM_KEY` (Vercel project settings).

**Custom domain:** after .TECH registers `policysim.tech`, add to Vercel project → Vercel provides A/CNAME → set DNS at .TECH → Vercel auto-issues SSL.

### .TECH domain (Pack perk)

- Claim code from education.github.com/pack → .TECH Domains partner link
- Register `policysim.tech` (alt: `policy-sim.tech`) for 1 year free
- Point DNS at Vercel per Vercel's custom-domain wizard

### Sentry (Pack perk)

- Claim via Pack → create project `policy-sim-api` (platform: FastAPI)
- Set `SENTRY_DSN` env var on Azure
- `api/main.py`:
  ```python
  sentry_sdk.init(
      dsn=os.environ["SENTRY_DSN"],
      integrations=[FastApiIntegration()],
      traces_sample_rate=0.2,
      environment="production",
  )
  ```

### Security

- `ANTHROPIC_API_KEY` only on Azure, never in frontend bundle.
- `X-POLICY-SIM-KEY` prevents casual abuse, not determined attackers.
- Rotate both after Apr 28.
- `simulation_runs/` contains synthetic reactions + policy text; no PII, no secrets.

---

## Verification

### Stage 0 — Day 3 morning must-pass gate

| Check | Command / action | Pass criteria |
|---|---|---|
| SSE unbuffered | `curl -N https://policysim.tech/api/smoke` | 20 events over 10 s, one every ~500 ms |
| Azure `/home` persists | Write file, `az webapp restart`, check `/home/simulation_runs` | File still present |
| Auth enforced | `curl https://policysim.tech/api/scenarios` (no header) | HTTP 401 |
| Sentry wired | GET `/api/debug/boom` → Sentry dashboard | Exception event within ~30 s |

### Stage 1 — Local end-to-end
```
# Terminal 1
cd policy-sim && uv run uvicorn api.main:app --port 8000

# Terminal 2
cd policy-sim/web && pnpm dev
```
Browser `http://localhost:5173` → Run UK 2010 VAT → supervisor banner → 4 cards stream in parallel → brief + validation render. Total ≤ ~120 s.

### Stage 2 — Replay (what demo records)
Replay mode + prior `run_id` → same visuals, 0 Anthropic calls.

### Stage 3 — Streamlit fallback intact
`uv run streamlit run app/main.py` still completes a run. Proves engine path unchanged.

### Stage 4 — Production deploy
`policysim.tech` resolves → full run through Vercel rewrite → Azure. Missing header → 401. Sentry shows zero errors on clean run.

### Stage 5 — Counter-scenario sign-flip (parent plan §Verification Stage 4)
`python -m simulation.cli validate --compare-runs <rise_id> <cut_id>` — unchanged.

### Stage 6 — Submission
- 3-min demo recorded off new frontend in replay mode
- README: new frontend = primary, Streamlit = fallback, architecture = Vite + FastAPI + Azure
- Submission form URL = `https://policysim.tech`

---

## Risk and cut order

If Day 4 afternoon check-in shows runway collapsing, drop in this strict order:

1. **v2 lip-sync MP4** (already stretch) — cut first.
2. **Reporter narration + thinking overlay polish** — audio remains, overlay is styling.
3. **Per-card audio + pulse animation** — cards text-only.
4. **Portraits** — cards show name + region badge only.
5. **Azure deploy** — fall back to Railway (30-day trial + $5/mo Hobby, zero-config nixpacks). Pre-authorized off-ramp. Keep `policysim.tech` pointed at Vercel regardless.
6. **Deploy at all** — fall back to local-only: record demo off `localhost:5173` + `localhost:8000`, submit with GitHub URL only. Pre-authorized.
7. **Switch to Streamlit entirely** — last resort. Video off Streamlit; README marks new frontend "in-progress".

**Azure-specific flag:** Azure App Service setup is ~1 hour more work than Railway. If Day 3 morning Stage 0 does not pass by Day 3 afternoon, trigger off-ramp #5 (Railway) and do not keep debugging Azure. The $100 credit is worth less than a day of build time.

---

## Open questions (resolve with user if they come up, don't decide alone)

- If v0.dev's one-shot output is poor → iterate with more prompts or drop to shadcn Blocks? (Default: one re-prompt, then Blocks.)
- If Azure Oryx buildpack fails on `uv` → fall back to `pip install -r requirements.txt` or trigger off-ramp #5? (Default: pip fallback once; if still broken, Railway.)
- If Sentry free-tier fills during dev from noisy errors → increase `traces_sample_rate` denominator, or disable traces? (Default: disable traces, keep error capture.)
- If `.TECH` domain propagation takes >24 h → use a Vercel subdomain for the submission? (Default: yes; a working `*.vercel.app` beats a broken `policysim.tech`.)

---

## Parent-plan integration

- `IMPLEMENTATION-PLAN.md` §Out of scope listed "Next.js / shadcn / D3 frontend" — reconciled: shadcn in, Next.js stays out, D3 stays out (Tremor replaces D3). Parent's Out-of-scope line should be updated to reflect the reconciliation.
- `IMPLEMENTATION-PLAN.md` Day 3 (Streamlit tasks 12–17) — files already exist and remain usable as fallback. New frontend is Day 3 + Day 4 primary work.
- `MEDIA-PLAN.md` v1 component locations (`agent_card.py`, etc.) — remain in Streamlit. Parallel React components (`ArchetypeCard.tsx`, etc.) are primary.
- `MEDIA-PLAN.md` v2 (Rhubarb lip-sync) — promoted from deferred to stretch; still governed by parent §v2.
- `.claude/agents/` secondary Claude Code runtime — unchanged Day 4 item.
- `policy-sim/CLAUDE.md` — update "Primary runtime" section once the Vite + FastAPI layer is committed; keep Streamlit command as fallback.
