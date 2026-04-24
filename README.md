# UK Fiscal Policy Simulation Platform

A multi-agent AI system that generates structured stakeholder reasoning for proposed fiscal policies in minutes — validated against published distributional evidence.

Live demo: **https://ai-policy-simulation.vercel.app**

---

## Why this matters

UK fiscal and social policy decisions are made with poor visibility into distributional effects across population segments. Standard practice is spreadsheet microsimulation combined with qualitative focus groups — typically weeks of turnaround between a policy proposal and any distributional analysis.

This platform compresses that cycle to minutes. It ingests a policy document and streams parallel first-person reasoning from four demographically-grounded UK population archetypes, grounded in ONS Family Resources Survey income and expenditure data. The output is a structured policy brief with distributional impact analysis, concrete recommendations, and automatic validation against IFS published findings.

---

## What it does

**Scenario:** The 2010 UK VAT rise (17.5% → 20%), validated against IFS 2011 distributional analysis.

**Pipeline:**

1. A **supervisor agent** reads the policy document and all four persona profiles, producing personalised briefings anchored in each archetype's specific income, spend, and household structure.

2. Four **archetype agents** run in parallel, each reasoning in first person about what the policy means to their actual household budget. Extended thinking is enabled — the archetypes do the arithmetic against their own persona before forming a view, and the reasoning is visible in the UI as it streams.

3. A **reporter agent** synthesises the four reactions into a structured policy brief: Summary, Distributional Impact, Key Concerns by Group, Recommendations, and Caveats — explicitly flagging the simulation boundary.

4. Results are automatically validated against IFS 2011 distributional findings — directional comparison of predicted impacts against published research, plus internal consistency checks.

**Archetypes (ONS/IFS-sourced demographics):**

| Archetype | Profile |
|---|---|
| Sarah, 34, North East | Part-time carer, single parent, 18,500/yr, 78% essential spend share |
| Mark, 48, South Yorkshire | Self-employed builder, VAT-registered sole trader, 38,500/yr |
| Priya, 31, Islington | Financial analyst, renting, 48,000/yr, deficit-concerned |
| Arthur, 72, Stoke-on-Trent | Retired factory worker, fixed income, 83% essential spend share |

---

## How to run

### Prerequisites
```bash
git clone <repo>
cd policy-sim
cp .env.example .env          # add ANTHROPIC_API_KEY and POLICY_SIM_KEY
pip install -r requirements.txt
```

### Primary: React dashboard (full-stack)
```bash
cd web && bun run dev:full
# Opens http://localhost:5173
```

Or run front and back separately:
```bash
# Terminal 1 — API
uv run uvicorn api.main:app --port 8000

# Terminal 2 — Frontend
cd web && bun dev
```

### Streamlit fallback
```bash
uv run streamlit run app/main.py
```

### CLI
```bash
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

---

## Architecture

```
Policy document
      |
      v
Supervisor agent           reads policy + all 4 persona JSONs
      |
      v  4 personalised briefings
      |
      +---> Archetype: Sarah  ---> extended thinking + Reaction tool call
      +---> Archetype: Mark   ---> extended thinking + Reaction tool call
      +---> Archetype: Priya  ---> extended thinking + Reaction tool call
      +---> Archetype: Arthur ---> extended thinking + Reaction tool call
                                               |
                                               v
                                      Reporter agent
                                               |
                                               v
                               Policy brief + IFS validation
```

Each arrow is an isolated `anthropic.messages.stream()` call. Four archetype calls run concurrently via `asyncio.gather()`. Tokens stream directly to the React UI via SSE (`/api/runs/:id/stream`).

**Stack:**
- Backend: FastAPI + sse-starlette, deployed on Azure App Service (B1 Linux, Python 3.11)
- Frontend: Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn, deployed on Vercel
- AI: Claude Opus 4.7 with adaptive extended thinking on all archetype calls
- Voices: edge-tts UK neural voices (en-GB); one voice per archetype
- Data: ONS Family Resources Survey 2010/11, IFS 2011 distributional analysis

---

## Opus 4.7 features demonstrated

- **Extended thinking** on all four archetype calls — visible reasoning tokens stream to the UI in real time
- **Tool-use structured output** — each archetype returns a typed `Reaction` schema (`immediate_impact`, `household_response`, `concerns`, `support_or_oppose`, `rationale`)
- **Prompt caching** on persona JSONs and knowledge-base documents — reduces latency and token cost on repeated runs
- **Long-context ingestion** — supervisor reads the full policy document and all four persona profiles in a single call
- **Differential information injection** — supervisor produces persona-specific briefings before each archetype reacts, preventing context contamination

---

## Validation

External validity is checked against IFS 2011 findings on the 2010 VAT rise:
- The platform predicts a regressive distributional profile (low-income and pensioner archetypes take proportionally larger hits)
- IFS 2011 confirmed this pattern in the actual policy outcome
- Directional match across all four archetypes

Internal consistency checks:
- Mathematical plausibility of stated impacts (VAT 2.5pp x essential spend share x income approximates archetype's stated annual hit)
- Cross-scenario sign flip: VAT cut run shows reversed `support_or_oppose` sign for each archetype
- Concern-rationale term overlap
- No-hallucinated-policy audit via tool schema enforcement

---

## Deployment

| Component | Service |
|---|---|
| Backend API | Azure App Service — policy-sim.azurewebsites.net |
| Frontend | Vercel — policysim.tech |
| Persistent run storage | Azure App Service `/home` (survives redeploys) |
| Auth | Shared-secret `X-POLICY-SIM-KEY` header / `?key=` query param |

---

## Project structure

```
policy-sim/
├── api/                     FastAPI layer (routes, SSE stream, auth)
├── simulation/              Core engine (engine.py, streaming.py, tts.py, validation.py)
├── app/                     Streamlit fallback
├── web/                     React frontend
├── data/archetypes/         Persona JSONs + portraits
├── knowledge_base/fiscal/   Policy documents + IFS validation data
├── .claude/skills/          SKILL.md system prompts loaded at runtime by Python
├── .claude/agents/          Claude Code secondary-runtime wrappers
└── simulation_runs/         Runtime artifacts (gitignored, reproduced via replay)
```

---

## Submission

Built for the Claude AI Hackathon, April 2026.
Scenario: UK 2010 VAT rise. Validation: IFS 2011 distributional analysis.
Primary URL: https://policysim.tech
