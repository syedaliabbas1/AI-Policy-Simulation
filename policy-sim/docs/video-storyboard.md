# Demo Video Storyboard — 3 Minutes

## Overview

Target length: 3:00. Record against Replay mode for the archetype section (deterministic, no API calls during filming). Switch to Live once to show real streaming. Screen recording + live narration in one take.

**UI reference:** The primary UI is the React dashboard at http://localhost:5173 (start with `bun run dev:full` from `policy-sim/web/`). The sticky header contains all controls. There is no sidebar.

---

## Section 1 — The Problem (0:00 – 0:25)

**Screen:** Project README or a static slide.

**Narration:**
> "UK fiscal policy is modelled as aggregate effects — tax revenue, GDP impact, headline distributional quintiles. What it rarely models is how a specific person, in a specific town, with a specific income and set of anxieties, actually experiences it.
>
> This platform does that. It takes a policy document and asks four real UK population archetypes — grounded in ONS household survey data and IFS distributional findings — to reason through it in their own voice."

---

## Section 2 — Loading the Scenario (0:25 – 0:45)

**Screen:** React dashboard at http://localhost:5173. Header bar visible. Status reads "READY".

**Action:** Show the Scenario dropdown. Select "UK VAT Rise 2010 (17.5% → 20%)".

**Narration:**
> "The scenario is the 2010 UK VAT rise — the Coalition's lead revenue measure. We have loaded the full policy document, background context, and IFS distributional validation anchors."

**Action:** Click the "Live" toggle so it is highlighted (switching from Replay to Live mode).

> "Running live against the API."

---

## Section 3 — Running Live (0:45 – 1:05)

**Screen:** Click "Run". Status changes to "BRIEFING ARCHETYPES". A gold banner appears below the header and starts filling with supervisor text.

**Narration:**
> "First, a supervisor agent reads the policy and produces a personalised briefing for each archetype: this person earns £18,200 and spends 78% of income on essentials — what does a 2.5-point VAT rise cost them in pounds, this week?
>
> Extended thinking is enabled. The model has space to do the arithmetic before it writes."

---

## Section 4 — Streaming Archetype Reactions (1:05 – 1:55)

**Screen:** The 2x2 archetype grid. Status reads "REASONING IN PROGRESS". Each card shows the green "Extended Thinking" terminal overlay with streaming reasoning text.

**Narration:**
> "Four archetypes run in parallel. Sarah — 34, single parent, care worker in Sunderland. Arthur — 72, retired factory worker in Stoke-on-Trent. Mark — 48, self-employed builder in South Yorkshire. Priya — 31, financial analyst in Islington.
>
> Each reasons in first person, from their own financial situation."

**Screen:** Pause on Sarah's card as reasoning fills.

> "Sarah is working out the arithmetic against her actual weekly shop and energy bill. Not a policy estimate — a person's specific budget, in their own words."

**Screen:** Pan to Priya's card (Urban Professional, Islington).

> "Priya concedes the personal impact is manageable on her income — but objects on structural grounds: the regressivity of VAT as a fraction of household spend, and the 80/20 cuts-to-tax mix."

**Screen:** Cards begin showing red "Oppose" left border and stance bars settling.

---

## Section 5 — The Policy Brief (1:55 – 2:25)

**Screen:** Scroll below the archetype grid to the Policy Brief section.

**Narration:**
> "The reporter aggregates all four reactions into a structured brief: distributional impact, key concerns by group, five concrete recommendations — and a simulation boundary statement, so decision-makers know exactly what kind of evidence this is."

**Screen:** Highlight the Recommendations section.

> "These are anchored to what the archetypes actually said: extend zero-rating to school-age footwear, publish a transparent benefits uprating schedule, provide cash-flow support for small trades businesses."

---

## Section 6 — Stance Overview + IFS Validation (2:25 – 2:48)

**Screen:** Stance Overview bar chart visible (in BriefDisplay, below the markdown).

**Narration:**
> "The stance chart shows support/oppose scores for each archetype. Everyone opposes the rise — but the shape matters: low income at −0.9, urban professional at −0.3."

**Screen:** Scroll to the IFS Validation stamps.

> "Validation runs automatically against IFS published findings. Four checks pass: directional sign correct, income ordering matches IFS quintile data, IFS concerns cited in rationale, no hallucinated policy content."

---

## Section 7 — Replay Mode + Close (2:48 – 3:00)

**Screen:** Click the "Replay" toggle (switch from Live to Replay). Click "Run". The simulation re-streams immediately with no API calls.

**Narration:**
> "Every run is persisted as token-level JSONL. Replay mode re-streams without an API call — useful for evaluation and iteration without burning compute.
>
> The platform runs on Claude Opus 4.7 with extended thinking. The thinking quality is the feature — it turns a policy document into a person's specific lived arithmetic."

---

## Recording Notes

- Record the archetype reaction section in Replay mode for smooth, deterministic playback (use the most recent completed uk_vat_2010 run ID set in PolicyInput.tsx `DEMO_RUN_ID`).
- Switch to Live for at least the supervisor phase (0:45–1:05) to show real API streaming.
- Zoom in on Sarah's card reasoning text and the IFS Validation stamps — most visually compelling outputs.
- Keep the header bar visible throughout — scenario selector, Live/Replay toggle, and status text are part of the UX story.
- Target: one take, no cuts. The streaming animation is the demo.
