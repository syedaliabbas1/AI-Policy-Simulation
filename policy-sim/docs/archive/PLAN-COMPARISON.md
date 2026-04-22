# Plan Comparison: minimaxplan vs policy-sim-master-reference

## Overview

We have two planning documents. They are related but serve different purposes.

---

## minimaxplan.md

**What it is:** A short, plain-English explanation of how to integrate the existing `agentic-bo` framework with the AI-Driven Policy Simulation Platform.

**Purpose:** Answer the question "how do we connect these two things?"

**Key points:**
- `agentic-bo` is a general-purpose Bayesian Optimization (BO) engine — it can optimize anything, not just chemistry
- The policy platform needs an "optimizer" to find the best policy configurations
- The integration point is the **Observer interface** — whoever implements `evaluate(suggestions)` can drive the BO engine
- Suggested building: `PolicySimulatorObserver`, `GovernmentDataConnector`, `BudgetConstraint`, `PolicyResearchAgent`
- Two options: deep integration (clean, reusable) vs lightweight coupling (quick, simple)

**Length:** ~4KB, layman-friendly

**Used by:** The `agentic-bo` framework and its optimization engine

---

## policy-sim-master-reference.md

**What it is:** A comprehensive, detailed master specification for building the full AI-Driven Policy Simulation Platform from scratch.

**Purpose:** The authoritative technical reference for the entire platform build — architecture, tech stack, agent design, implementation phases, research areas.

**Key points:**
- Full 6-layer platform architecture (UI → Policy → Simulation → Data → Agents → Orchestration)
- 8 agent archetypes for fiscal policy simulation
- AgentTorch for population-scale simulation, LangGraph for orchestration
- Phase 2 adds the Forum (inter-agent communication)
- Federated computing (Flower + Opacus) for data sovereignty
- Blockchain audit trail (Hyperledger Fabric)
- 26+ week implementation timeline across 6 phases
- Full tech stack specified (Next.js, FastAPI, Qdrant, Neo4j, etc.)

**Length:** ~45KB, highly detailed

**Used by:** The full policy simulation platform build team

---

## How They Relate

```
policy-sim-master-reference.md
        |
        | (the Orchestration Engine layer
        |  could use agentic-bo's engine for
        |  multi-objective policy optimization)
        |
        v
minimaxplan.md
        |
        | (shows HOW to connect
        |  agentic-bo to policy-sim)
        |
        v
agentic-bo/
        (existing BO framework)
```

**`minimaxplan.md`** shows the integration bridge between the two.

---

## Key Differences

| Aspect | minimaxplan.md | policy-sim-master-reference.md |
|--------|---------------|-------------------------------|
| **Purpose** | Integration plan | Full platform specification |
| **Scope** | Connecting existing tools | Building new platform from scratch |
| **Audience** | Developers linking systems | Full build team |
| **Length** | Short (~4KB) | Comprehensive (~45KB) |
| **Tech stack** | Reuses agentic-bo | Specifies all new components |
| **Timeline** | Not specified | 26+ weeks, 6 phases |
| **Agents** | Basic policy agents | 8 detailed archetypes + supervisor + reporting |
| **Novel contribution** | Shows integration path | Full architectural vision |

---

## What We're Actually Building

The **long-term goal** is the full platform described in `policy-sim-master-reference.md`.

The **starting point** is using `agentic-bo` (as described in `minimaxplan.md`) to provide:
- The optimization engine for finding best policy configurations
- The suggest/observe/record loop infrastructure
- The research-agent orchestration pattern

**Eventually**, the full AgentTorch-based simulation (as specified in `policy-sim-master-reference.md`) would replace or enhance the BO optimization layer — but the pattern and infrastructure from `agentic-bo` gives us a working foundation to start from.

---

*minimaxplan.md — integration path between agentic-bo and policy platform*
*policy-sim-master-reference.md — full platform vision and specification*
