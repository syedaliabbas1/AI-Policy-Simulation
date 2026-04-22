# Demo Video Storyboard — 3 Minutes

## Overview

Target length: 3:00. No voiceover required if screen captions are used. Recommended: screen recording + live narration in one take.

---

## Section 1 — The Problem (0:00 – 0:30)

**Screen:** Static slide or the project README hero section.

**Narration:**
> "When governments design fiscal policy, they model aggregate effects — tax revenue, GDP impact, headline distributional quintiles. What they rarely model is how a specific person, in a specific town, with a specific income and set of anxieties, actually experiences it.
>
> This platform does that. It takes a policy document, and it asks four real UK population archetypes — grounded in ONS household data and IFS distributional findings — to reason through it in their own voice."

---

## Section 2 — Loading the Scenario (0:30 – 0:50)

**Screen:** Streamlit sidebar. Show the scenario dropdown open.

**Action:** Select "UK VAT Rise 2010 (17.5% → 20%)".

**Narration:**
> "The scenario is the 2010 VAT rise — the Coalition's lead revenue measure. We've loaded the full policy document, background context, and IFS validation anchors."

**Screen:** Show Mode toggle on "Live (API)".

> "We're running live against the API."

---

## Section 3 — Supervisor Phase (0:50 – 1:10)

**Screen:** Click "Run Simulation". Spinner appears.

**Narration:**
> "First, a supervisor agent reads the policy and writes a personalised briefing for each archetype — concretely: this person earns £18,200, spends 78% of income on essentials. What does a 2.5-point VAT rise mean to them, in pounds, this week?
>
> Extended thinking is on. The model has space to actually do the arithmetic before it writes."

---

## Section 4 — Streaming Archetype Reactions (1:10 – 1:50)

**Screen:** The 2x2 archetype grid. Thinking captions are streaming in real time.

**Narration:**
> "Four archetypes run in parallel. Sarah — 34, single parent, care worker in Sunderland. Margaret — 71, retired pensioner in Stoke. David — 48, builder in South Yorkshire. James — 29, urban professional in London.
>
> Each reasons in first person, from their own financial situation."

**Screen:** Pause on Sarah's card once it populates.

> "Sarah says: 'three hundred and something quid a year I haven't got.' Not a policy estimate — a person's specific budget arithmetic, in their own words."

**Screen:** Pan to James's card.

> "James, on £48k, concedes the personal impact is manageable — but objects on structural grounds: the regressivity on an income basis, and the 80/20 spending-cuts-to-tax mix."

---

## Section 5 — The Policy Brief (1:50 – 2:20)

**Screen:** Scroll down to the Policy Brief section.

**Narration:**
> "The reporter aggregates all four reactions into a structured brief: distributional impact, key concerns by group, five concrete recommendations — and a simulation boundary statement, so decision-makers know exactly what kind of evidence this is."

**Screen:** Highlight the Recommendations section.

> "These aren't generic policy suggestions. They're anchored to what the archetypes actually said — extend zero-rating to school-age footwear, publish a transparent benefits uprating schedule, provide cash-flow support for small trades businesses."

---

## Section 6 — Stance Chart + IFS Validation (2:20 – 2:45)

**Screen:** Scroll to the Stance Overview bar chart.

**Narration:**
> "The stance chart shows support/oppose scores for each archetype. Everyone opposes the VAT rise — but the shape matters: low income at −0.9, urban professional at −0.3."

**Screen:** Highlight the IFS Validation panel.

> "Validation runs automatically against IFS published findings. All four checks pass: directional sign correct, income ordering matches IFS quintile data, IFS concerns appear in the rationale, no hallucinated policy content."

---

## Section 7 — Replay Mode + Close (2:45 – 3:00)

**Screen:** Switch Mode to "Replay", select the run, click Replay.

**Narration:**
> "Every run is persisted as token-level JSONL. Replay mode re-streams without an API call — useful for demos, evaluation, and prompt iteration without burning compute.
>
> The platform is built on Claude Opus 4.7 with extended thinking. The thinking quality is the feature — it's what turns a policy document into a person's specific lived arithmetic."

---

## Recording Notes

- Use a completed run in Replay mode for the archetype reaction section to ensure smooth playback.
- Switch to Live mode for at least one full run in the recording to show real API streaming.
- Zoom in on Sarah's card text and the IFS Validation badges — these are the most visually compelling outputs.
- Keep the sidebar visible throughout — the scenario selection and mode toggle are part of the UX story.
- Target: one take, no cuts. The streaming animation is the demo — don't cut away from it.
