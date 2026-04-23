# Azure Deployment Plan — Policy Simulation Backend

**Status:** Deployed and Verified
**Created:** 2026-04-23
**Subscription:** Azure for Students (3aa1775b-6510-4f86-aa4d-6d3e337157b5)
**az CLI path:** `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd`

---

## Mode

MODIFY — existing codebase, all deploy config in place.

## Target Architecture

| Resource | Value |
|----------|-------|
| Resource group | `policy-sim-rg` |
| App Service Plan | `policy-sim-plan` (B1 Linux) |
| Web App name | `policy-sim` → `policy-sim.azurewebsites.net` |
| Runtime | Python 3.11 |
| Region | West Europe |
| Startup command | `bash startup.sh` |
| Persistent storage | `/home/simulation_runs` |

## Environment Variables

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | **user must provide** |
| `POLICY_SIM_KEY` | **user must provide** |
| `SENTRY_DSN` | optional, user provides |
| `SIMULATION_RUNS_ROOT` | `/home/simulation_runs` |
| `WEBSITES_PORT` | `8000` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
| `CORS_ORIGINS` | `https://policy-sim.vercel.app,https://policysim.tech` |

## Deploy Method

**AZCLI zip-deploy** — direct `az webapp` commands. No azd needed (all config already exists).

## Execution Steps

- [x] 1. Create resource group `policy-sim-rg` in austriaeast (West Europe restricted by policy)
- [x] 2. Create App Service Plan `policy-sim-plan` (B1 Linux)
- [x] 3. Create Web App `policy-sim` (Python 3.11)
- [x] 4. Set startup command: `gunicorn api.main:app --worker-class uvicorn.workers.UvicornWorker ...`
- [x] 5. Set Always On and all environment variables
- [x] 6. Zip-deploy `policy-sim/` (git archive HEAD:policy-sim)
- [x] 7. Health check `GET /api/health` → 200 ✓
- [x] 8. SSE buffering test → ticks at ~500ms intervals ✓ (pass)
- [x] 9. Scenarios endpoint → 3 scenarios ✓

## Pre-deploy Changes Made

- `startup.sh` — changed `uv run gunicorn` to `gunicorn` (Oryx pip-installs deps to antenv, not uv venv)
- `api/main.py` — added `/api/smoke` SSE endpoint (20 ticks × 500ms, auth-bypassed)
- `api/auth.py` — added `/api/smoke` and `/api/scenarios` to bypass list

## Secrets Needed from User

Before step 6 (deploy), user must provide:
- `ANTHROPIC_API_KEY`
- `POLICY_SIM_KEY`
- (optional) `SENTRY_DSN`
