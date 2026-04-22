# AI-Driven Policy Simulation Platform
## Master Reference Document

> This document is the single source of truth for the project. It covers architecture, tech stack, agent design, implementation phases, research areas, and key design principles. All team members should treat this as the primary reference throughout the build.

---

## 1. Project Overview

This project builds a full-stack AI-driven policy simulation platform that allows national governments and policymakers to test the impact of policies **before** real-world deployment. Rather than relying on traditional expert advice and static economic models, the platform uses large language models, multi-agent systems, and agentic AI to simulate emergent population-level behaviour at scale.

The core concept is a **digital twin** — a simulated socio-economic environment populated by LLM-guided agents representing real demographic groups. Policymakers introduce a policy into this environment and observe how the population reacts, what second-order effects emerge, and what unintended consequences arise — all without any real-world risk.

**Proof-of-Concept Domain: Fiscal & Taxation Policy**
The first implementation target is fiscal policy simulation — specifically income tax bracket reform and welfare benefit changes. This domain is chosen because:
- Rich public datasets exist (census data, income distributions, employment statistics)
- Population reactions are well-studied and can be validated against historical data
- It is concrete enough to ground all architectural decisions without being too narrow
- It has direct relevance to the government client use case

---

## 2. Core Design Principles

These principles govern every architectural and implementation decision in the project.

**2.1 Human-in-the-Loop (HITL)**
The platform is not an autonomous decision-making system. It is an experimental tool. At every stage — from simulation configuration to results interpretation — human policymakers remain in control. The system must support HITL checkpoints where experts can review, override, or redirect simulation behaviour before it proceeds.

**2.2 Emergent Behaviour Over Controlled Output**
The value of the platform comes from what the simulation reveals that humans did not expect. Agent behaviour must not be over-controlled. Policymakers configure *who* is in the simulation; developers define *how* agents behave. This boundary must be respected at every layer.

**2.3 Differential Information Injection**
Agents do not all receive the same briefing about a policy. The supervisor translates policy documents into group-specific briefings that reflect how each demographic would realistically encounter that policy in the real world — through news, social media, word of mouth, or professional channels. Noise and incompleteness in information delivery are features, not bugs.

**2.4 Auditability and Transparency**
Every simulation run must be fully reproducible and auditable. All agent decisions, forum posts, state transitions, and outcomes must be logged in structured, inspectable files. Blockchain/DLT provides the immutable audit trail required for government use.

**2.5 Data Sovereignty via Federated Computing**
Sensitive national data (census records, health data, economic indicators) must never leave its jurisdiction. The platform uses federated computing so that algorithms come to the data, not the other way around. No centralised data lake is permitted for sensitive inputs.

**2.6 Domain Agnosticism**
The platform is not built for one policy domain. Policymakers can upload their own documents and the supervisor agent adapts. The knowledge base grows over time. The agent behaviour model is domain-agnostic.

---

## 3. Platform Architecture

The platform is organised into six layers. Each layer has a clear responsibility and communicates with adjacent layers through defined interfaces.

```
┌─────────────────────────────────────────────────────┐
│              LAYER 1: Stakeholder UI                │
├─────────────────────────────────────────────────────┤
│           LAYER 2: Policy Intervention              │
├─────────────────────────────────────────────────────┤
│        LAYER 3: Simulation & Experimentation        │
├─────────────────────────────────────────────────────┤
│          LAYER 4: Data & Knowledge                  │
├─────────────────────────────────────────────────────┤
│       LAYER 5: Simulation Core (Agents & MAS)       │
├─────────────────────────────────────────────────────┤
│       LAYER 6: Orchestration & Execution Engine     │
└─────────────────────────────────────────────────────┘
```

### Layer 1 — Stakeholder UI
The interface used by policymakers, researchers, and citizens. It exposes:
- Policy document upload (PDF, DOCX, plain text)
- Population group selection (demographic presets defined by developers)
- Scenario parameter configuration (simulation duration, domain, policy parameters)
- Real-time simulation progress monitoring
- Results dashboard with charts, timelines, and policy brief output
- Human-in-the-loop checkpoints — pause, review, redirect

The UI enforces the boundary between policymaker control and agent internals. It never exposes agent behaviour configuration to end users.

### Layer 2 — Policy Intervention Layer
Defines the policy being simulated. Responsibilities:
- Parse and store uploaded policy documents
- Chunk and embed documents into the vector knowledge base
- Define policy parameters (e.g. tax rate, implementation date, affected groups)
- Define simulation scenario (which population groups, what duration, which domains to measure)
- Generate the policy scenario object that the orchestration engine consumes

### Layer 3 — Simulation & Experimentation Layer
The sandbox environment where policies are tested. Responsibilities:
- Manage simulation rounds (each round = one time step in the policy rollout)
- Coordinate the supervisor agent briefing cycle
- Manage the forum (Phase 2) — round-based posting and reading
- Record all agent reactions per round in structured logs
- Support Monte Carlo runs (multiple stochastic runs of the same scenario to quantify outcome variance)
- Support scenario comparison (run policy A vs policy B, display delta)
- Support counterfactual analysis (what would have happened without this policy)

### Layer 4 — Data & Knowledge Layer
The context that agents reason against. Responsibilities:
- Vector database of policy documents, legislation, economic data, historical policy outcomes
- Census and demographic data per jurisdiction
- Real-time web search capability for current context (news, recent events)
- Prebuilt knowledge bases per domain (fiscal, health, climate, urban)
- Document ingestion pipeline (upload → chunk → embed → store)
- Retrieval API used by the supervisor and agents

### Layer 5 — Simulation Core
The agent layer. Responsibilities:
- Define agent archetypes (demographic clusters sharing behavioural characteristics)
- Run population-scale agent simulations (target: thousands to millions of agents depending on compute)
- Each agent maintains: demographic profile, prior beliefs, current knowledge state, reaction history
- Agent classes: Citizens (multiple demographic groups), Economic Actors (businesses, employers), Government Bodies, Media/Information Channels
- Agents react to policy briefings and (Phase 2) to each other via the forum
- Self-improving agent models that refine behaviour calibration against real-world data

### Layer 6 — Orchestration & Execution Engine
The runtime that coordinates everything. Responsibilities:
- Load agents and inject context at the start of each round
- Run the supervisor agent (comprehend policy → produce group-specific briefings)
- Dispatch briefings to agent groups
- Collect and record agent reactions
- Manage state across rounds (persistent, resumable, inspectable)
- Run the final reporting agent (aggregate outcomes → policy brief)
- Enforce HITL checkpoints
- Interface with the federated computing layer for multi-partner data access
- Interface with the DLT layer for audit logging

---

## 4. Agent Architecture

### 4.1 The Supervisor Agent
The most important agent in the system. It sits between the policy document and the population agents.

**Responsibilities:**
- Fully comprehend the policy from uploaded documents and the knowledge base
- Understand the broader legislative and economic context via RAG
- Produce group-specific briefings — not a single uniform summary, but tailored translations of the policy for each demographic group
- Calibrate information completeness per group (high-income professional gets accurate detailed summary; low-income rural worker gets vague partial summary — reflecting real-world information access inequality)
- Oversee sub-agent reactions and identify emerging patterns
- Trigger additional retrieval if agents surface questions or gaps
- Collect structured outputs from all sub-agents at the end of each round

**Implementation pattern:** Planner/executor architecture. The supervisor plans the briefing strategy, delegates execution to group-specific briefing generators, then collects and synthesises results.

### 4.2 Population Sub-Agents
Represent the simulated population. Each agent has:
- **Static profile:** age, income bracket, employment sector, geographic region, education level, family structure
- **Belief state:** prior attitudes toward government, economic outlook, political leaning
- **Knowledge state:** what they currently know about the policy (injected by supervisor, updated by forum in Phase 2)
- **Reaction function:** given context + knowledge + profile → produce structured reaction (behavioural intent, sentiment, economic decision)

**Agent archetypes (LLM archetype model):** Rather than running a full LLM call per agent (computationally prohibitive at scale), agents are grouped into archetypes — clusters of agents sharing demographic characteristics. The LLM is queried once per archetype, and the result is distributed across all agents in that cluster. This enables simulation of millions of agents with a fraction of the LLM calls.

**For the fiscal PoC, initial archetypes include:**
- High-income urban professional
- Middle-income suburban family
- Low-income rural worker
- Small business owner
- Retired pensioner
- Young urban graduate (entry-level employed)
- Unemployed / welfare recipient
- Public sector employee

### 4.3 The Reporting Agent
Runs after simulation completes. Responsibilities:
- Aggregate reactions across all agent groups and rounds
- Identify emergent patterns (consensus forming, polarisation, protest likelihood, economic behaviour shifts)
- Quantify outcomes (sentiment scores, behavioural intent distributions, economic impact estimates)
- Produce structured results (JSON) and human-readable policy brief (Markdown/PDF)
- Flag unintended consequences and equity implications
- Provide uncertainty estimates (confidence intervals from Monte Carlo runs)

### 4.4 Policymaker vs Developer Control Boundary

| Controlled by Policymakers (UI) | Controlled by Developers (Code/Config) |
|---|---|
| Which population groups to simulate | How each agent class reasons and decides |
| Policy document upload | Agent prompt templates and behaviour profiles |
| Scenario parameters (duration, domain) | Archetype definitions and demographic clusters |
| Population model selection (preset) | Validation against real-world data |
| HITL checkpoint decisions | Information injection calibration per group |

---

## 5. The Forum (Phase 2)

The forum is the inter-agent communication layer. It simulates public discourse — the mechanism by which individual reactions become collective behaviour.

### 5.1 Why It Matters
Without inter-agent communication, the simulation only captures initial reactions. The forum captures:
- How opinion evolves as people discuss
- Whether certain groups amplify or suppress dissent
- How misinformation spreads
- How quickly consensus forms or fails to form
- Which demographic groups influence others most

### 5.2 Architecture
The forum is a shared message board — a structured database of posts with agent ID, archetype group, round number, content, sentiment score, and optionally replies.

**Round structure with forum:**
1. Briefing phase — supervisor injects policy context to agents
2. Read phase — agents retrieve relevant posts from previous round via RAG (not all posts — filtered by semantic relevance to their profile)
3. Reaction phase — agents form updated opinions incorporating both policy brief and forum posts
4. Post phase — agents publish structured posts to the forum
5. Recording phase — orchestrator extracts structured signals (sentiment, behavioural intent, dissent level) for the report layer

### 5.3 Key Design Decisions
- **Turn-based rounds** — not asynchronous, to maintain causal clarity and auditability
- **RAG-filtered reading** — agents embed forum posts into the vector store; each agent retrieves the most relevant posts to its demographic and interests, preventing information overload
- **Dampening mechanism** — limits how much an agent's belief state can shift per round, preventing runaway feedback loops and echo chamber amplification
- **External grounding** — periodic injection of factual external information (news events, official announcements) to prevent discourse from drifting entirely into self-referential loops

### 5.4 Implementation Notes
The forum database is a Postgres table. Posts are embedded and stored in the vector database alongside policy documents. The RAG pipeline already built for the knowledge layer serves double duty for forum retrieval. No separate infrastructure is needed beyond the additional table and embedding pipeline.

---

## 6. Tech Stack

### 6.1 Simulation Core
| Component | Technology | Rationale |
|---|---|---|
| Population-scale agent simulation | **AgentTorch** (MIT Media Lab) | Purpose-built for LLM-guided ABM at millions of agents; LLM archetype model reduces compute cost; GPU-optimised; open source |
| Multi-agent orchestration | **LangGraph** | Graph-based state machine; supports supervisor/worker hierarchies; built-in HITL interrupts; persistent state; full audit trail via LangSmith |
| LLM backbone | **Claude API (Anthropic)** | Long context window; strong instruction following; structured output; ideal for policy reasoning agents |
| Alternative/fallback LLM | **GPT-4o** | Fallback and comparison |

### 6.2 Knowledge & RAG Layer
| Component | Technology | Rationale |
|---|---|---|
| Document ingestion & retrieval framework | **LlamaIndex** | Best-in-class for complex multi-hop retrieval; supports knowledge graph indexing; integrates with all major vector stores |
| Vector database | **Qdrant** | High performance; supports hybrid search (BM25 + vector); strong filtering; self-hostable for data sovereignty |
| Knowledge graph (policy relationships) | **Neo4j** | GraphRAG for structured relationships between policies, stakeholders, outcomes; improves explainability |
| Embedding model | **text-embedding-3-large** (OpenAI) or **BGE-M3** (open source) | High quality embeddings; BGE-M3 preferred for self-hosted sovereign deployments |
| Web search | **Tavily API** | Real-time web retrieval for agents needing current context |
| Reranking | **Cohere Rerank** or **BGE Reranker** | Improves retrieval precision for policy domain queries |

### 6.3 Federated Computing Layer
| Component | Technology | Rationale |
|---|---|---|
| Federated learning framework | **Flower (FLWR)** | Production-ready; PyTorch native; cross-silo federation; minimal code changes to existing models |
| Privacy preservation | **Opacus** (PyTorch differential privacy) | Adds calibrated noise to model updates before sharing; prevents data reconstruction |
| Secure aggregation | **PySyft** | Homomorphic encryption and secure multi-party computation for sensitive aggregation |
| Federated orchestration | **NVIDIA FLARE** | Enterprise-grade cross-organisation federation; audit logging built in |
| Data mesh / local control | **Apache Arrow Flight** | Standardised API for in-place computation across data partners |

### 6.4 Distributed Ledger / Auditability Layer
| Component | Technology | Rationale |
|---|---|---|
| Blockchain framework | **Hyperledger Fabric** | Permissioned blockchain; suitable for government use; no cryptocurrency; strong access control |
| Smart contracts | **Hyperledger Chaincode** | Automates policy constraint enforcement and audit logging |
| Audit logging | All simulation runs, agent decisions, and outcome reports are hashed and logged to the ledger | Provides immutable record required for government accountability |
| Tokenization | Future phase — tokenized policy scenarios for cross-jurisdiction sharing | |

### 6.5 Data & Infrastructure
| Component | Technology | Rationale |
|---|---|---|
| Primary database | **PostgreSQL** | Simulation state, agent profiles, forum posts, run metadata |
| Message queue | **Redis** | Agent task queuing; forum post buffering between rounds |
| Object storage | **MinIO** (self-hosted S3-compatible) | Policy documents, simulation artifacts, report outputs |
| Compute | **GPU cluster** (RTX 3090 or equivalent) | AgentTorch requires GPU for population-scale simulation |
| Container orchestration | **Docker + Kubernetes** | Scalable deployment; service isolation |
| Observability | **LangSmith** | LangGraph trace logging; agent decision audit; token usage monitoring |

### 6.6 Frontend & Reporting
| Component | Technology | Rationale |
|---|---|---|
| Frontend framework | **Next.js 15** | App Router; server components; API routes; strong TypeScript support |
| UI components | **shadcn/ui + Tailwind CSS** | Rapid, consistent, accessible UI components |
| Data visualisation | **D3.js** | Custom simulation outcome charts, population reaction timelines, policy impact heatmaps |
| Supplementary charts | **Recharts** | Simpler charts for dashboards (sentiment over time, group comparison) |
| Report generation | **Markdown → PDF** via **Pandoc** or **React-PDF** | Policy brief output for government clients |
| Real-time updates | **WebSockets** (via Next.js API routes) | Live simulation progress pushed to UI |

### 6.7 Backend & API
| Component | Technology | Rationale |
|---|---|---|
| API framework | **FastAPI** (Python) | Async; automatic OpenAPI docs; native Pydantic validation; integrates cleanly with Python ML stack |
| Authentication | **NextAuth.js** | Policymaker and researcher access control |
| API gateway | **Nginx** | Reverse proxy; rate limiting; SSL termination |

---

## 7. Data Architecture

### 7.1 Simulation State
Every simulation run produces a structured set of artifacts, persisted to disk and referenced by the orchestration engine. The engine is stateless in memory — it replays from files. This makes runs resumable, auditable, and inspectable at any point.

```
simulation_runs/
  <run_id>/
    scenario_state.json       # Machine-readable simulation state
    simulation_plan.md        # Human-readable run notebook
    policy_brief.md           # Final output document
    reactions/
      round_001.jsonl         # Agent reactions per round
      round_002.jsonl
      ...
    forum/
      posts_round_001.jsonl   # Forum posts per round (Phase 2)
      ...
    reports/
      report.json             # Structured outcome data
      convergence.png         # Outcome evolution chart
```

### 7.2 Scenario State Schema
```json
{
  "run_id": "string",
  "created_at": "ISO timestamp",
  "status": "initialised | running | paused | completed",
  "policy_domain": "fiscal | health | climate | urban | custom",
  "policy_document_ids": [],
  "population_groups": [],
  "simulation_rounds": 0,
  "current_round": 0,
  "agent_archetypes": [],
  "scenario_parameters": {},
  "hitl_checkpoints": [],
  "outcome_metrics": {},
  "federated_partners": [],
  "audit_chain_id": "string"
}
```

### 7.3 Reaction Record Schema
```json
{
  "round": 0,
  "agent_id": "string",
  "archetype": "string",
  "demographic_group": "string",
  "knowledge_state": "string",
  "sentiment_score": 0.0,
  "behavioural_intent": "string",
  "economic_decision": "string",
  "dissent_level": 0.0,
  "confidence": 0.0,
  "raw_response": "string"
}
```

---

## 8. Key Research Areas

Before and during implementation, the team must develop working knowledge in the following areas. Each maps directly to a platform component.

### 8.1 LLM Archetype Model (Critical — build first)
- Study AgentTorch's LLM archetype methodology (MIT Media Lab, AAMAS 2025 paper)
- Understand the trade-off between individual agent expressiveness and computational feasibility at scale
- Research how to cluster demographic groups into archetypes that balance realism with compute cost
- Validate archetype behaviour against real-world survey and census data

### 8.2 Multi-Agent Orchestration with LangGraph
- Study LangGraph's supervisor/worker pattern
- Understand state management (TypedDict schemas, reducer functions, checkpointing)
- Implement HITL interrupt/resume patterns
- Study LangSmith for observability and trace auditing

### 8.3 RAG for Policy Documents
- Study LlamaIndex multi-hop retrieval for complex policy queries
- Study GraphRAG with Neo4j for relationship-aware retrieval
- Research chunking strategies for long legal/policy documents
- Research hybrid search (BM25 + vector) for policy terminology

### 8.4 Federated Computing
- Study Flower (FLWR) for cross-silo federation setup
- Understand differential privacy with Opacus — noise calibration vs model quality trade-offs
- Study the Fenoglio & Treleaven (2026) federated computing paper referenced in the project paper
- Research data mesh architecture for distributed data sovereignty

### 8.5 Blockchain Auditability
- Study Hyperledger Fabric permissioned blockchain setup
- Understand chaincode (smart contracts) for automated policy constraint enforcement
- Research hash-based audit logging for simulation runs
- Understand DLT tokenization for cross-jurisdiction scenario sharing

### 8.6 Simulation Validation
- Research methods for validating agent behaviour against real-world data (survey data, historical policy outcomes, census records)
- Study sensitivity analysis — Monte Carlo methods for quantifying outcome variance
- Research bias detection in LLM-guided agents (demographic fairness, stereotype mitigation)
- Study Stanford's simulation validation methodology (interview-based agent grounding)

### 8.7 Ethical & Governance Framework
- Study the EU AI Act high-risk classification requirements — this platform likely qualifies
- Research consent frameworks for using population data in simulation
- Research re-identification risks in agent training data
- Define responsibility framework — who is liable if a simulation recommends a flawed policy
- Study the "over-reliance" risk — design guardrails that prevent policymakers from treating agent outputs as ground truth

---

## 9. Implementation Phases

### Phase 0 — Foundation (Weeks 1–4)
**Goal:** Core infrastructure and proof-of-concept simulation loop working end to end on the fiscal PoC domain.

- Set up monorepo structure (Next.js frontend, FastAPI backend, Python simulation core)
- Set up PostgreSQL, Redis, MinIO, Qdrant
- Build document ingestion pipeline (upload → chunk → embed → store in Qdrant)
- Preload fiscal PoC knowledge base (UK/target jurisdiction tax legislation, census data, income distribution data)
- Implement basic supervisor agent (LangGraph) — reads policy document, produces group briefings
- Implement 3 initial agent archetypes (high-income professional, middle-income family, low-income worker)
- Implement basic simulation round loop (brief → react → record)
- Implement basic results display in UI
- Validate archetype reactions against historical data for a known past tax policy

**Milestone:** End-to-end simulation of a simple income tax change with 3 population groups, producing a readable output.

### Phase 1 — Full Agent Layer (Weeks 5–10)
**Goal:** Complete agent architecture, full archetype set, HITL, and reporting agent.

- Expand to full 8 archetype set for fiscal PoC
- Implement differential information injection (calibrated briefing per group)
- Implement reporting agent (aggregate reactions → structured JSON → policy brief Markdown)
- Implement HITL checkpoints in orchestration engine
- Implement Monte Carlo runs (multiple stochastic runs, confidence intervals)
- Implement scenario comparison (Policy A vs Policy B)
- Implement LangSmith observability
- Build out full policymaker UI (scenario configuration, real-time progress, results dashboard)
- Implement D3 visualisations (sentiment timeline, group comparison, outcome heatmaps)

**Milestone:** Full simulation of a complex fiscal policy with 8 population groups, HITL, Monte Carlo variance quantification, and downloadable policy brief.

### Phase 2 — Forum & Inter-Agent Discourse (Weeks 11–16)
**Goal:** Add the forum layer enabling emergent collective behaviour through inter-agent communication.

- Design forum database schema (PostgreSQL)
- Implement forum post/read cycle within simulation rounds
- Implement RAG-filtered reading (agents retrieve relevant posts via Qdrant)
- Implement belief state dampening mechanism (prevent runaway feedback loops)
- Implement external grounding injections (factual news events per round)
- Add forum visualisations to UI (discourse evolution, opinion clustering, influence mapping)
- Validate forum dynamics against known social phenomena (polarisation, consensus formation)
- Extend reporting agent to capture collective discourse patterns

**Milestone:** Simulation that shows measurable opinion evolution across rounds, demonstrable emergent collective behaviour different from isolated reactions.

### Phase 3 — Federated Computing & Data Sovereignty (Weeks 17–22)
**Goal:** Enable multi-partner data collaboration without centralising sensitive data.

- Set up Flower (FLWR) federated learning infrastructure
- Implement Opacus differential privacy for model updates
- Implement data mesh architecture (local data, federated algorithms)
- Set up standardised OpenAPI-defined federated endpoints
- Test cross-partner simulation with synthetic multi-jurisdiction data
- Implement decentralised governance layer (multi-party control)
- Document data sovereignty compliance (GDPR, jurisdiction-specific regulations)

**Milestone:** Simulation running across two simulated data partners, with no raw data crossing organisational boundaries.

### Phase 4 — Blockchain Auditability (Weeks 23–26)
**Goal:** Implement the immutable audit trail required for government deployment.

- Set up Hyperledger Fabric permissioned blockchain
- Implement chaincode for simulation run logging
- Hash and log all simulation runs, agent decisions, and policy briefs to the ledger
- Implement audit query interface for compliance review
- Implement smart contract policy constraint enforcement
- Explore tokenization for cross-jurisdiction scenario sharing

**Milestone:** Every simulation run has a verifiable, tamper-proof audit chain accessible to authorised reviewers.

### Phase 5 — Scale & Domain Expansion (Weeks 27+)
**Goal:** Scale to population-level simulation and expand beyond fiscal PoC.

- Scale AgentTorch to millions of agents (GPU cluster deployment)
- Add new policy domains: public health, climate & environmental policy, urban planning, AI governance
- Expand knowledge base per domain
- Implement domain-switching in UI (policymaker selects domain or uploads custom documents)
- Implement self-improving agent models (agents refine behaviour from simulation feedback)
- Government client onboarding and deployment

---

## 10. Application Domains

As defined in the project paper, the platform supports the following policy simulation domains. All are supported through the same architecture — the domain is determined by the knowledge base content and the policy document uploaded.

| Domain | Key Metrics | Example Scenarios |
|---|---|---|
| **Fiscal & Taxation** *(PoC)* | Income distribution, compliance rates, economic activity | Income tax reform, VAT changes, welfare benefit restructuring |
| **Public Health & Social Policy** | Healthcare utilisation, epidemic spread, public compliance | Pandemic response, vaccination mandates, mental health policy |
| **Climate & Environmental Policy** | Emissions trajectories, energy transition adoption, investment flows | Carbon tax, emissions trading, renewable energy incentives |
| **Urban & Infrastructure Planning** | Traffic flows, housing demand, disaster response times | Congestion charging, zoning reform, green infrastructure |
| **Energy Markets & Resource Management** | Energy security, market pricing, consumption patterns | Energy rationing, grid decarbonisation, resource allocation |
| **Technology & AI Governance** | Regulatory compliance, innovation rates, public trust | AI Act implementation, data privacy regulation, platform liability |

---

## 11. Challenges, Risks & Mitigations

These are drawn directly from the project paper and must be actively managed throughout the build.

### Technical Challenges

| Challenge | Mitigation |
|---|---|
| **Scale vs expressiveness trade-off** — full LLM per agent is computationally prohibitive at population scale | Use AgentTorch LLM archetype model; query LLM once per archetype cluster, not per individual agent |
| **Non-determinism** — small prompt variations produce divergent outcomes | Implement Monte Carlo runs; fix random seeds per run; log all stochastic inputs |
| **Validation gaps** — agents benchmarked against human self-consistency which itself varies | Validate against historical policy outcome data; use real survey data for archetype calibration |
| **Black-box reasoning** — causal attribution in multi-agent systems is difficult | LangSmith trace logging; mandatory explainability layer in reporting agent; confidence intervals on all outcomes |

### Ethical Challenges

| Challenge | Mitigation |
|---|---|
| **Privacy and re-identification** — agents built from sensitive demographic data risk leakage | Differential privacy via Opacus; no individual-level data in agent profiles; aggregate statistics only |
| **Consent and data stewardship** — downstream policy use of simulation raises ongoing control questions | Clear data governance framework; jurisdiction-specific compliance; audit trail via Hyperledger |
| **Bias amplification** — agents inherit training data biases; simulations could encode designer values | Diverse training data for archetypes; regular bias audits; equity metrics tracked per simulation run |
| **Responsibility gaps** — if simulation recommends a flawed policy, liability is unclear | Mandatory HITL; simulation outputs are advisory only; policymakers must formally acknowledge advisory nature before accessing results |

### Societal & Policy Risks

| Risk | Mitigation |
|---|---|
| **Over-reliance** — policymakers treat agent outputs as oracles | UI language explicitly frames outputs as exploratory; mandatory uncertainty display; HITL checkpoints |
| **Misuse for disinformation** — synthetic public opinion could be weaponised | Access control; audit logging; no public API for raw agent outputs; IRB-style review process for sensitive runs |
| **Inequity amplification** — simulations mask disparate impacts on underrepresented groups | Mandatory equity metrics per run; disaggregated results by demographic group; minority group representation audits |

### Governance & Oversight

| Issue | Mitigation |
|---|---|
| **Transparency** — multi-step agent reasoning is opaque | Mandatory explainability in reporting agent; uncertainty quantification; independent audit access |
| **Regulatory fragmentation** — no unified global standards for simulation in policymaking | Design for EU AI Act high-risk compliance from day one; document jurisdiction-specific adaptations |
| **Commercial influence** — simulation design could favour certain outcomes | Open methodology documentation; academic peer review; government client sign-off on archetype definitions |

---

## 12. Skill Definitions

Each major agent class has a defined skill — a structured specification of its role, inputs, outputs, and guardrails. These are the authoritative definitions for the team.

---

### SKILL: supervisor-agent

**Role:** Policy comprehension and differential briefing generator.

**Inputs:**
- Policy document (from vector knowledge base)
- List of active population archetypes
- Current simulation round number
- Prior round reaction summary (rounds > 1)
- Web search results (if enabled)

**Process:**
1. Retrieve policy document chunks from knowledge base via RAG
2. Retrieve relevant legislative/economic context from prebuilt knowledge base
3. If web search enabled, retrieve current news context
4. Produce full policy comprehension summary (internal, not shown to sub-agents)
5. For each active archetype, produce a group-specific briefing calibrated to:
   - What that demographic typically knows about policy
   - How they typically receive information (media channels, social networks)
   - What aspects of the policy most directly affect them
6. Validate briefings for factual accuracy against source documents
7. Dispatch briefings to agent groups
8. After reactions are collected, produce round summary for orchestration engine

**Outputs:**
- Per-archetype briefing objects (structured JSON)
- Round comprehension summary
- Retrieval provenance log (which documents were used)

**Guardrails:**
- Must not give all archetypes identical briefings
- Must not fabricate policy details not present in source documents
- Must flag when policy document is ambiguous or incomplete
- Must log all retrieved sources for auditability

---

### SKILL: population-agent

**Role:** Simulate the reaction of a specific demographic archetype to a policy briefing.

**Inputs:**
- Archetype profile (demographic characteristics, prior beliefs, economic situation)
- Policy briefing (from supervisor — calibrated to this archetype)
- Current knowledge state (accumulated across rounds)
- Forum posts from previous round (Phase 2 — RAG-retrieved, filtered to relevant)

**Process:**
1. Read policy briefing in context of own demographic profile and prior beliefs
2. (Phase 2) Read relevant forum posts from previous round
3. Reason about how this policy affects the archetype specifically
4. Produce structured reaction:
   - Sentiment score (-1.0 to 1.0)
   - Behavioural intent (comply, resist, adapt, exit, protest)
   - Economic decision (spend more, save more, invest, withdraw, no change)
   - Dissent level (0.0 to 1.0)
   - Natural language response (for forum post — Phase 2)
5. Update own knowledge state

**Outputs:**
- Structured reaction record (JSON)
- Natural language forum post (Phase 2)
- Updated knowledge state

**Guardrails:**
- Reaction must be grounded in the briefing received — not in knowledge the archetype would not realistically have
- Belief state shift per round must be within defined dampening bounds
- Must not produce reactions inconsistent with demographic profile
- Must flag uncertainty when briefing is ambiguous

---

### SKILL: reporting-agent

**Role:** Aggregate simulation outcomes into a structured policy brief.

**Inputs:**
- All reaction records across all rounds (from reactions JSONL files)
- Forum post history (Phase 2)
- Scenario state (policy parameters, population groups, simulation duration)
- Monte Carlo run results (if multiple runs were executed)
- Knowledge base (for contextualising outcomes against historical precedents)

**Process:**
1. Aggregate sentiment scores by archetype and round → produce sentiment timeline
2. Aggregate behavioural intents → produce population-level behavioural forecast
3. Identify emergent patterns (polarisation, consensus, protest likelihood, economic flight)
4. Quantify equity implications (which groups are most negatively affected)
5. Compare against Monte Carlo runs → produce confidence intervals
6. Identify unintended consequences (second-order effects not anticipated in policy design)
7. Contextualise outcomes against historical policy data from knowledge base
8. Produce structured JSON report
9. Produce human-readable Markdown policy brief

**Outputs:**
- `report.json` — structured outcome data
- `policy_brief.md` — human-readable summary for policymakers
- `equity_report.json` — disaggregated impact by demographic group
- `uncertainty_report.json` — confidence intervals from Monte Carlo runs

**Guardrails:**
- Must not present simulation outputs as predictions — frame as exploratory scenarios
- Must include uncertainty estimates on all quantitative claims
- Must prominently surface equity implications
- Must include explicit caveats about simulation limitations
- Must not recommend a policy — only describe simulated outcomes
- All claims must be traceable to specific reaction records (no invented conclusions)

---

## 13. Validation Strategy

Simulation results are only credible if agents behave in ways consistent with how real people would behave. Validation must happen at multiple levels.

**Archetype validation:** Before running any new policy scenario, validate each archetype's baseline behaviour against real survey data. For the fiscal PoC, use UK Household Longitudinal Study data to verify that high-income professional archetypes respond to tax changes in ways consistent with observed behaviour.

**Historical policy replay:** Run the simulation on a historical policy that has already been implemented and for which outcome data exists. Compare simulated population reactions against actual recorded reactions (surveys, economic data). Use this to calibrate archetype behaviour and identify systematic biases.

**Sensitivity analysis:** Run Monte Carlo simulations (minimum 30 runs per scenario) with varied random seeds. Report confidence intervals on all outcomes. Flag scenarios where outcome variance is high — these indicate the simulation is not stable enough to support policy conclusions.

**Demographic fairness audits:** After each simulation, run automated checks for demographic bias — ensure minority groups are not systematically underrepresented or stereotyped. Use paired contrast testing (vary only one demographic attribute and check for unjustified response differences).

**Independent review:** For government client deployments, engage an independent academic reviewer to audit archetype definitions and simulation methodology before results are presented to policymakers.

---

## 14. Directory Structure

```
policy-sim/
├── frontend/                    # Next.js 15 application
│   ├── app/                     # App Router pages
│   ├── components/              # UI components (shadcn/ui)
│   └── lib/                     # API clients, utilities
│
├── backend/                     # FastAPI application
│   ├── api/                     # Route handlers
│   ├── models/                  # Pydantic schemas
│   └── services/                # Business logic
│
├── simulation/                  # Python simulation core
│   ├── engine/                  # Orchestration engine
│   │   ├── engine.py            # SimulationEngine class
│   │   ├── state.py             # State management
│   │   └── cli.py               # CLI interface
│   ├── agents/                  # Agent implementations
│   │   ├── supervisor.py        # Supervisor agent
│   │   ├── population.py        # Population agent base
│   │   ├── archetypes/          # Per-archetype configurations
│   │   └── reporting.py         # Reporting agent
│   ├── forum/                   # Forum layer (Phase 2)
│   │   ├── board.py             # Forum state management
│   │   └── retrieval.py         # RAG-filtered post retrieval
│   ├── knowledge/               # RAG & knowledge base
│   │   ├── ingestion.py         # Document upload pipeline
│   │   ├── retrieval.py         # Query interface
│   │   └── web_search.py        # Tavily integration
│   ├── observers/               # Pluggable population observers
│   │   └── base.py              # Observer ABC
│   └── skills/                  # Agent skill definitions
│       ├── supervisor-agent/    # SKILL.md + prompts
│       ├── population-agent/    # SKILL.md + prompts
│       └── reporting-agent/     # SKILL.md + prompts
│
├── federated/                   # Federated computing layer
│   ├── flower/                  # Flower FL setup
│   ├── privacy/                 # Opacus DP integration
│   └── mesh/                    # Data mesh configuration
│
├── blockchain/                  # Hyperledger Fabric setup
│   ├── chaincode/               # Smart contracts
│   └── audit/                   # Audit query interface
│
├── simulation_runs/             # Runtime simulation artifacts
│   └── <run_id>/
│       ├── scenario_state.json
│       ├── simulation_plan.md
│       ├── policy_brief.md
│       ├── reactions/
│       ├── forum/
│       └── reports/
│
├── knowledge_base/              # Prebuilt domain knowledge bases
│   ├── fiscal/
│   ├── health/
│   ├── climate/
│   └── urban/
│
├── data/                        # Reference and validation datasets
│   ├── census/
│   ├── surveys/
│   └── historical_policies/
│
└── docs/                        # Project documentation
    ├── architecture/
    ├── api/
    └── deployment/
```

---

## 15. Team Responsibilities (Suggested Split for 8-Person Team)

| Role | Responsibilities |
|---|---|
| **Simulation Core (2 people)** | AgentTorch integration, agent archetype implementation, orchestration engine, supervisor agent, population agents |
| **Knowledge & RAG (1 person)** | LlamaIndex pipeline, Qdrant setup, Neo4j GraphRAG, document ingestion, web search integration |
| **Frontend (2 people)** | Next.js UI, D3 visualisations, policymaker dashboard, real-time WebSocket updates, policy brief rendering |
| **Backend & API (1 person)** | FastAPI, PostgreSQL, Redis, MinIO, authentication, API design |
| **Federated & Blockchain (1 person)** | Flower FLWR, Opacus, Hyperledger Fabric, audit logging, data sovereignty compliance |
| **Validation & Evaluation (1 person)** | Archetype validation against real data, Monte Carlo analysis, bias audits, equity metrics, LangSmith observability |

---

## 16. Key References

- Treleaven & Brown (2025) — The AI Revolution: Socio-political and economic impacts on national governance. *Nature Machine Intelligence*
- Fenoglio & Treleaven (2026) — Federated computing: information integration under sovereignty constraints. *Royal Society Open Access*
- Chopra et al. (AAMAS 2025) — On the limits of agency in agent-based models. AgentTorch / MIT Media Lab
- Mihai et al. (2022) — Digital twins: A survey on enabling technologies, challenges, and trends. *IEEE Communications Surveys & Tutorials*
- Kreuzer et al. (2024) — Digital twins for socio-political simulation. *Simulation Modelling Practice and Theory*
- Mosquiera-Ray (2022) — Human-in-the-loop AI: A framework for responsible deployment. *AI & Ethics*
- Salvagno, Taccone & Gerli (2023) — Hallucination and bias in AI systems. *Critical Care*
- EU AI Act (2024) — High-risk AI system classification and compliance requirements

---

*Document version: 1.0 — Generated from project design sessions. Update this document as architectural decisions evolve. All team members should flag inconsistencies or gaps as they are discovered during implementation.*
