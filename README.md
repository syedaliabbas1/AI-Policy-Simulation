# UK Fiscal Policy Simulation

AI-driven platform that simulates how different population archetypes reason about UK fiscal policy — built for the Anthropic Hackathon April 2026.

## Project structure

```
ai-govt-policy/
├── IMPLEMENTATION-PLAN.md    # Full technical specification
├── policy-sim/              # Main deliverable — simulation platform
│   ├── README.md           # Detailed platform documentation
│   ├── app/                # Streamlit UI
│   ├── simulation/         # Claude SDK engine, CLI, replay, validation
│   ├── knowledge_base/     # Policy scenarios + IFS validation data
│   └── data/archetypes/    # Four grounded population personas
└── agentic-bo/              # Reference codebase (reuse source, not edited)
```

## Quick start

```bash
cd policy-sim
cp .env.example .env         # add ANTHROPIC_API_KEY
uv pip install -r requirements.txt
uv run streamlit run app/main.py
```

Open http://localhost:8501. Select a scenario and click **Run Simulation**.

## CLI

```bash
uv run python -m simulation.cli init --scenario knowledge_base/fiscal/uk_vat_2010.md
uv run python -m simulation.cli run --run-id <id>
uv run python -m simulation.cli report --run-id <id>
uv run python -m simulation.cli replay --run-id <id>
```

## What it does

1. **Supervisor** reads a policy document and writes a personalised briefing for each archetype.
2. **Four archetypes** reason in parallel with extended thinking enabled (Sarah, Margaret, David, James).
3. **Reporter** aggregates reactions into a structured policy brief.
4. **IFS validation** checks the brief against published distributional findings.

## Scenario

Primary scenario: UK 2010 VAT rise (17.5% to 20%), validated against IFS 2011 distributional analysis.

Counterfactual scenario: hypothetical VAT cut (20% to 15%) included for comparison testing.
