# Policy Simulation Hackathon — Implementation Plan

**Status:** approved, implementation not yet started (Day 1 of 5).
**Submission deadline:** April 26–27, 2026. Live finals April 28.
**Primary artifact location:** `D:\work\ai-govt-policy\policy-sim\` (to be created).
**Reference framework to reuse:** `D:\work\ai-govt-policy\agentic-bo\`.

---

## Resuming in a fresh session — read this first

This plan is designed to survive across sessions and agents (Sonnet, MiniMax, Opus). If you are a new agent picking this up:

1. **Read this entire file first.** It is the single source of truth. Do not re-plan.
2. **Recreate the task list in your session.** Prior task lists do NOT transfer. Use TaskCreate to rebuild tasks from the "Build Sequence" section below. Mark them in_progress / completed as you go.
3. **Check current progress** by listing `D:\work\ai-govt-policy\policy-sim\` — what exists is done, what is missing is not. Cross-reference against the "File Layout" section.
4. **Follow the user's global CLAUDE.md** at `C:\Users\Ossaid\.claude\CLAUDE.md`:
   - No emojis anywhere in code or docs
   - No "Generated with Claude" attribution on commits
   - Opinionated recommendations with tradeoffs, ask before assuming direction
   - Review thoroughly before making changes
5. **Reuse from `agentic-bo/`** wherever the "Reuse" table below calls it out. Do not reimplement what already exists.
6. **Do not drift from scope.** Tier C is locked. Anything listed as "out of scope" stays out — no Next.js, no LangGraph, no paid services.
7. **Default to Opus 4.7** for code the user runs; Sonnet is fine for writing plans, docs, and summaries; Haiku for trivial transformations.
8. **Ask the user before any destructive action** (deleting files, force pushes, rebases, overwriting uncommitted work).

If any section of this plan conflicts with user instructions issued live in the session, the live instructions win — update this plan file to reflect the change.

---

## Context

**Problem.** UK fiscal and social policy decisions are made with poor visibility into distributional effects across population segments. Current practice is spreadsheet microsimulation plus qualitative focus groups — slow, labour-intensive, weeks of turnaround. This platform generates simulated stakeholder reasoning for a proposed policy in minutes, grounded in real demographic data and validated against published IFS distributional analysis.

**Starting state.** The repo at `D:\work\ai-govt-policy\` has three contradictory planning documents (`minimaxplan.md`, `policy-sim-master-reference.md`, Treleaven's PDF workplan for a different project). The user has declared all three reference-only. This plan replaces them as the implementation spec.

**Judging criteria and weights.**
- Impact (30%) — real-world potential, who benefits
- Demo (25%) — working, impressive, holds up live (pre-recorded 3-min video + live replay on Apr 28)
- Opus 4.7 Use (25%) — creative, beyond basic integration, surprising capabilities
- Depth & Execution (20%) — craft, engineering soundness, wrestled-with quality

**Intended outcome.** A Streamlit-based, Claude-Code-native demo that ingests a policy document and streams live reasoning from four UK population archetypes in parallel, ending in a synthesised policy brief validated against IFS 2011 distributional findings on the 2010 VAT rise.

---

## Deliverables on submission day

1. **Runnable Streamlit app** — `streamlit run app/main.py` with a valid `ANTHROPIC_API_KEY` completes end-to-end
2. **Runnable CLI** — `python -m simulation.cli init/run/report/replay` completes end-to-end
3. **Pre-recorded 3-minute demo video** — filmed against a `--replay` run for deterministic timing
4. **Open-source repository** at `policy-sim/` with setup, scenario, architecture in the README
5. **100–200 word submission summary** — platform, scenario, archetypes, validation in plain English

---

## Scope (Tier C — locked)

### In scope

**Core simulation**
- New directory `D:\work\ai-govt-policy\policy-sim\` with working code
- Supervisor → 4 parallel archetypes → reporter pipeline
- Four persona JSONs with realistic ONS-sourced demographics
- Three SKILL.md files used by Python at runtime as system prompts (single source of truth)
- Observer ABC, SimulationEngine, RunPaths, I/O helpers adapted from `agentic-bo/`

**Opus 4.7 creative-use features (maps to 25% criterion)**
- Extended thinking enabled on archetype calls — visible reasoning streams into the UI (two sections per card: thinking + reaction)
- Tool-use structured output — archetypes return a `Reaction` tool call with enforced JSON schema
- Prompt caching on persona JSONs and `knowledge_base/` documents
- Dual runtime: primary = Python + Anthropic SDK + Streamlit; secondary = `.claude/agents/` wrappers for Claude Code invocation
- Differential information injection — supervisor produces persona-specific briefings before archetypes react
- Long-context ingestion — supervisor ingests full policy document in one call, no chunking

**Demo infrastructure**
- JSON/JSONL run persistence under `simulation_runs/<run_id>/`
- Replay mode (`--replay <run_id>`, matching Streamlit toggle) — rehydrates a completed run, streams back with artificial pacing, used to record the demo video deterministically
- Validation panel — layered validation with pass/fail badges:
  - **External validity:** directional comparison of archetype predictions against IFS 2011 findings on the 2010 VAT rise (pattern-oriented modelling — we validate against aggregate published patterns, not individual ground truth)
  - **Internal consistency (automated):** mathematical plausibility of stated impacts (e.g., VAT 2.5pp × essential spend share × income ≈ archetype's stated hit), cross-scenario sign flip (VAT rise vs VAT cut should flip `support_or_oppose`), concern-rationale term overlap, no-hallucinated-policy check (tool schema + content audit)
- Counter-scenario test in the verification stage — run archetypes on a hypothetical VAT cut (20% → 17.5%) and assert that each archetype's `support_or_oppose` sign flips relative to the VAT rise run
- 3-minute demo video storyboard + recording

**Documentation**
- Top-level `CLAUDE.md`, `README.md` (latter written as a funder/government pitch)
- Archive `minimaxplan.md`, `policy-sim-master-reference.md`, `PLAN-COMPARISON.md` to `policy-sim/docs/archive/` with a README explaining supersession
- 100–200 word written summary for the submission form

### Out of scope (stays out)

- Next.js / shadcn / D3 frontend
- LangGraph, CrewAI, AutoGen, or any multi-agent framework beyond Claude Code skills + direct SDK
- Neo4j GraphRAG, Hyperledger Fabric, Flower federated learning, Kubernetes, PostgreSQL
- Tavily, Qdrant Cloud, LangSmith, any paid service beyond Anthropic tokens
- Inter-agent "forum" round-robin discourse between archetypes
- More than 4 archetypes
- Edits to archived planning docs

---

## Architecture

### Pipeline per run

```
Policy text input
      │
      ▼
supervisor-agent          (reads policy + all 4 persona JSONs)
      │
      ▼ produces 4 tailored briefings
      │
      ├──▶ archetype [low-income worker]    ──▶ extended thinking + reaction (tool call)
      ├──▶ archetype [small-business owner] ──▶ extended thinking + reaction (tool call)
      ├──▶ archetype [urban professional]   ──▶ extended thinking + reaction (tool call)
      └──▶ archetype [retired pensioner]    ──▶ extended thinking + reaction (tool call)
                                                                   │
                                                                   ▼
                                                           reporting-agent
                                                                   │
                                                                   ▼
                                                     brief.md + chart data + IFS validation
```

Every arrow is one `anthropic.messages.stream()` call with its own isolated context. No shared session. Four archetype calls run in parallel via `asyncio.gather()`. Tokens (including extended-thinking deltas) stream directly to Streamlit UI cards.

### Dual runtime

- **Primary (Streamlit demo):** `streamlit run app/main.py` → Python orchestrator → SDK streaming → live UI cards. This is what the video records.
- **Secondary (Claude Code):** `claude "simulate vat-2010"` → Claude Code picks up `.claude/agents/supervisor.md` → subagent delegates to the Python engine → produces identical JSONL artifacts. Documents the agentic architecture on disk for the Opus 4.7-use score.

Both paths load the same SKILL.md prompts and write to the same `simulation_runs/<run_id>/` layout.

### Isolation model

Each SDK call is a fresh context. Supervisor sees all personas (to produce briefings) but not reactions. Each archetype sees only its own persona + briefing (no context contamination between archetypes). Reporter sees all briefings + all reactions.

---

## File layout

```
policy-sim/
├── CLAUDE.md                           # Top-level guide for Claude Code operators
├── README.md                           # Submission-facing; written as a government pitch
├── requirements.txt                    # anthropic, streamlit, pydantic, python-dotenv
├── .env.example
├── .gitignore                          # simulation_runs/, .env, __pycache__, .venv/
│
├── .claude/
│   ├── skills/                         # Loaded by Python as prompts (primary runtime)
│   │   ├── supervisor-agent/SKILL.md
│   │   ├── archetype-agent/SKILL.md
│   │   └── reporting-agent/SKILL.md
│   └── agents/                         # Subagent wrappers (secondary runtime)
│       ├── supervisor.md
│       ├── archetype.md
│       └── reporter.md
│
├── simulation/
│   ├── __init__.py
│   ├── engine.py                       # SimulationEngine (from agentic-bo BOEngine)
│   ├── cli.py                          # init / run / report / replay commands
│   ├── streaming.py                    # SDK wrapper: streaming + thinking + tool-use + caching
│   ├── caching.py                      # Prompt caching block constructor
│   ├── replay.py                       # Load + re-emit JSONL at paced cadence
│   ├── validation.py                   # IFS directional-comparison checker
│   ├── utils.py                        # RunPaths, run-id, JSON I/O (from agentic-bo/utils.py)
│   └── observers/
│       ├── __init__.py
│       ├── base.py                     # Observer ABC (verbatim from agentic-bo)
│       └── archetype.py                # ArchetypeReactionObserver
│
├── app/
│   ├── main.py                         # Streamlit entry: input → cards → brief
│   └── components/
│       ├── agent_card.py               # Streaming card: thinking block + reaction block
│       ├── policy_input.py             # Scenario picker + run/replay toggle
│       ├── brief_display.py            # Markdown render + support/oppose bar chart
│       └── validation_panel.py         # IFS pass/fail badges
│
├── knowledge_base/
│   └── fiscal/
│       ├── uk_vat_2010.md              # Policy summary + HMRC/IFS/ONS context (~400 words)
│       ├── background_context.md
│       └── ifs_2011_validation.json    # Structured IFS findings for validation
│
├── data/
│   └── archetypes/
│       ├── low_income_worker.json
│       ├── small_business_owner.json
│       ├── urban_professional.json
│       └── retired_pensioner.json
│
├── simulation_runs/                    # Runtime artifacts (content gitignored)
│   └── <run_id>/
│       ├── state.json
│       ├── briefings/<archetype>.json
│       ├── reactions/<archetype>.jsonl # JSONL: thinking deltas + final tool call
│       ├── brief.md
│       └── validation.json
│
└── docs/
    ├── video-storyboard.md             # 3-minute demo script and shot list
    └── archive/
        ├── README.md                   # Why these are archived + what superseded
        ├── minimaxplan.md
        ├── policy-sim-master-reference.md
        └── PLAN-COMPARISON.md
```

---

## Reuse from `agentic-bo/` (verified file references)

| Target in `policy-sim/` | Source in `agentic-bo/` | Action |
|---|---|---|
| `simulation/observers/base.py` | `bo_workflow/observers/base.py` (`Observer` ABC, `evaluate()`, `source` property) | Copy verbatim |
| `simulation/utils.py` | `bo_workflow/utils.py` — `RunPaths`, `generate_run_id`, `read_json`, `write_json`, `append_jsonl`, `read_jsonl`, `utc_now_iso`, `to_python_scalar` | Copy; drop `EvaluationBackendPaths` |
| `simulation/engine.py` | `bo_workflow/engine.py` — `BOEngine` class (line 321) — keep `init_run`/`observe`/`report`/`status` shape | Adapt: rename `BOEngine` → `SimulationEngine`; replace `suggest` with `brief`; replace main loop with supervisor → archetypes → reporter |
| `simulation/cli.py` | `bo_workflow/cli.py` — `register_commands()` + `handle()` modular pattern | Adopt pattern; swap commands |
| `.claude/skills/*/SKILL.md` format | `agentic-bo/.claude/skills/bo-*/SKILL.md` — frontmatter + Command + Return + Notes | Copy format; replace chemistry wording |
| `simulation_runs/<run_id>/` layout | `bo_runs/<run_id>/` — state.json, suggestions.jsonl, observations.jsonl | Follow same shape; rename to `briefings/`, `reactions/` |

**Do NOT port:** HEBO/BoTorch optimizers, `ProxyObserver`, RDKit/DFT converters, oracle training.

---

## Archetype persona JSON schema

```json
{
  "id": "low_income_worker",
  "display_name": "Sarah, 34, part-time carer",
  "demographics": {
    "age": 34,
    "household": "single parent, 2 children",
    "region": "North East England",
    "income_gbp": 18500,
    "employment": "part-time care work, 25 hrs/wk"
  },
  "financial_context": {
    "savings_gbp": 200,
    "mortgage": false,
    "rent_gbp_month": 650,
    "essential_spend_share": 0.78
  },
  "concerns": ["fuel bills", "school costs", "food prices"],
  "policy_interests": ["VAT on essentials", "benefits", "child support"],
  "communication_style": "plain, direct, sometimes frustrated; concrete examples from daily life"
}
```

Four personas, figures drawn from ONS Family Resources Survey and IFS 2011 distributional tables:
- `low_income_worker` — bottom quintile household
- `small_business_owner` — self-employed, VAT-registered
- `urban_professional` — third quintile, London
- `retired_pensioner` — state pension reliant

---

## Agent SKILL.md design

Each SKILL.md is written such that its body is a valid system prompt. Python reads the file at runtime, strips frontmatter, uses the body as the `system=` argument to `anthropic.messages.stream()`.

### `supervisor-agent/SKILL.md`
- **Input:** policy text + all archetype JSONs
- **Output:** one briefing JSON per archetype (`{archetype_id, headline, key_points, personal_relevance}`)
- **Enforcement:** "You translate policy into personalised relevance; never invent policy content. Factually accurate emphasis, not distortion."

### `archetype-agent/SKILL.md`
- **Input:** one archetype persona JSON + one briefing
- **Extended thinking:** enabled — "Think through, in this persona's voice and reasoning style, how this policy affects their specific financial and daily situation."
- **Output:** `Reaction` tool call with schema: `immediate_impact` (str), `household_response` (str), `concerns` (list[str]), `support_or_oppose` (float, -1 to +1), `rationale` (str)
- **Enforcement:** "Reason AS this persona. Use their communication style. Do not reason as a policy analyst."

### `reporting-agent/SKILL.md`
- **Input:** all briefings + all reactions
- **Output:** markdown policy brief with sections `Summary`, `Distributional Impact`, `Key Concerns by Group`, `Recommendations`, `Caveats`
- **Enforcement:** "You aggregate, you do not moralise. Quote specific archetype reactions. Flag the simulation boundary — this is reasoning, not primary polling."

---

## Build sequence — 4–5 day timeline (recreate this as tasks in your session)

### Day 1 (Apr 22) — Foundation
1. Create `policy-sim/` tree + `requirements.txt` + `.env.example` + `.gitignore`
2. Port `observers/base.py` + `utils.py` from `agentic-bo/`
3. Write three SKILL.md files (supervisor, archetype, reporter) with extended-thinking + tool-use instructions
4. Write four archetype JSONs (ONS/IFS-sourced figures)
5. Write `knowledge_base/fiscal/uk_vat_2010.md` + `background_context.md` + `ifs_2011_validation.json`

### Day 2 (Apr 23) — Engine + CLI
6. `simulation/streaming.py` — SDK wrapper (streaming + extended thinking + tool use + prompt caching)
7. `simulation/engine.py` — SimulationEngine with `init_run`, `brief`, `react_parallel`, `report`
8. `simulation/cli.py` — `init`, `run`, `report`, `replay` commands (register/handle pattern from agentic-bo)
9. `simulation/replay.py` — JSONL rehydration + paced re-emission
10. `simulation/validation.py` — IFS directional comparison + internal-consistency checks (mathematical plausibility, concern-rationale overlap, hallucination check) + counter-scenario sign-flip test
11. **Verify:** full CLI run end-to-end against live API, artifacts land in `simulation_runs/<run_id>/`

### Day 3 (Apr 24) — UI
12. `app/components/agent_card.py` — streaming card with thinking block + reaction block
13. `app/components/policy_input.py` — scenario picker + run/replay toggle
14. `app/components/brief_display.py` — markdown render + support/oppose bar chart
15. `app/components/validation_panel.py` — IFS pass/fail badges
16. `app/main.py` — wires input → engine → 4 parallel streams → brief
17. **Verify:** `streamlit run app/main.py`, UK VAT scenario completes with live streaming + replay mode

### Day 4 (Apr 25) — Polish + video
18. `.claude/agents/` subagent wrappers (supervisor.md, archetype.md, reporter.md)
19. Top-level `CLAUDE.md` + `README.md` (funder-facing)
20. Archive old docs to `docs/archive/` with supersession README
21. Write `docs/video-storyboard.md`
22. Record 3-minute demo video against a `--replay` run
23. Write 100–200 word submission summary

### Day 5 (Apr 26–27) — Buffer + submit
24. Recording retakes if needed
25. Archetype prompt tuning if quality needs it
26. Final submission upload

---

## Verification

### Stage 1 — CLI end-to-end
```
cd policy-sim
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
python -m simulation.cli run --run-id <id>
python -m simulation.cli report --run-id <id>
```
**Pass:** `simulation_runs/<id>/brief.md` exists, contains all 4 archetype references, non-empty distributional section, `validation.json` shows directional comparison results.

### Stage 2 — Streamlit UI
```
streamlit run app/main.py
```
**Pass:** enter policy text, supervisor briefing appears, four streaming cards show live thinking + reaction tokens, final brief renders with chart and IFS validation panel within ~90s.

### Stage 3 — Replay mode
```
python -m simulation.cli replay --run-id <id>
```
**Pass:** streams identical output from cached JSONL with artificial pacing, zero API calls.

### Stage 4 — Counter-scenario sign-flip test
```
python -m simulation.cli run --scenario knowledge_base/fiscal/uk_vat_cut_hypothetical.md
python -m simulation.cli validate --compare-runs <vat_rise_id> <vat_cut_id>
```
**Pass:** each archetype's `support_or_oppose` score has opposite sign between the rise and cut runs. Confirms internal reasoning consistency.

### Stage 5 — Secondary Claude Code runtime
```
claude "run a policy simulation on the UK 2010 VAT scenario"
```
**Pass:** Claude Code loads `.claude/agents/supervisor.md`, dispatches to Python engine, produces identical `simulation_runs/<run_id>/` artifacts.

### Stage 6 — Submission readiness
- Runnable Streamlit + CLI paths from a fresh clone
- 3-minute demo video rendered and under platform size limit
- README reads as a government-facing pitch, not a dev README
- 100–200 word summary drafted

---

## Video storyboard (3 minutes, 180s)

Written into `docs/video-storyboard.md` on Day 4 before recording.

| Time | Content |
|---|---|
| 0:00–0:15 | Problem overlay: "UK fiscal policy analysts use spreadsheets + focus groups, weeks of turnaround. We do it in 3 minutes with simulated stakeholder reasoning." |
| 0:15–0:40 | Architecture diagram: supervisor → 4 archetypes → reporter, Opus 4.7 Extended Thinking callout |
| 0:40–0:55 | Streamlit app opens, UK 2010 VAT scenario pre-loaded, presenter clicks Run |
| 0:55–1:10 | Supervisor briefing phase visible |
| 1:10–2:20 | Four archetype cards streaming in parallel — thinking blocks, then reactions, distinct voices |
| 2:20–2:45 | Final policy brief + support/oppose chart |
| 2:45–2:55 | IFS validation panel — directional pass badges |
| 2:55–3:00 | Call to action / repo URL |

Recorded against `--replay` — deterministic, no API dependency during filming.

---

## Critical files to create / modify

**Create** — everything under `policy-sim/` per the file layout.

**Move (not modify)** during Day 4:
- `D:\work\ai-govt-policy\minimaxplan.md` → `policy-sim/docs/archive/minimaxplan.md`
- `D:\work\ai-govt-policy\policy-sim-master-reference.md` → `policy-sim/docs/archive/`
- `D:\work\ai-govt-policy\PLAN-COMPARISON.md` → `policy-sim/docs/archive/`

**Leave alone:**
- `agentic-bo/` — referenced source, not edited
- Three PDFs + `links.txt` — reference material, stay in place
- This file (`IMPLEMENTATION-PLAN.md`) — update only if live instructions change scope

---

## Decisions locked

- **Scenario** = UK 2010 VAT rise (17.5% → 20%), validated against IFS 2011
- **4 archetypes** — JSON personas + one shared `archetype-agent/SKILL.md` + distinct runtime streaming sessions (Option C hybrid)
- **SKILL.md body = prompt source of truth**, loaded by Python at runtime (Approach I)
- **Dual runtime** — Streamlit primary, `.claude/agents/` secondary
- **Extended thinking** enabled on archetype calls
- **Tool-use structured output** for reactions
- **Prompt caching** on personas + knowledge_base
- **JSONL artifact persistence + replay mode**
- **No CrewAI, no LangGraph, no paid services**
- **Master-ref archived, not edited**; 4 "must-fix" items obsolete
- **Tier C scope** (full build with all Opus 4.7 creative-use features)
