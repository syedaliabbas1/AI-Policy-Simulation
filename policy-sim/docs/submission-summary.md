# Submission Summary

UK Fiscal Policy Simulation Platform — a multi-agent system that takes a government policy document and streams parallel reasoning from four demographically-grounded UK population archetypes using Claude Opus 4.7 with extended thinking.

The platform ingests policy documents (starting with the 2010 UK VAT rise), uses a supervisor agent to produce personalised briefings anchored in each archetype's specific income and spend profile, then runs four archetype agents in parallel — each reasoning in first person about what the policy means to their actual household budget. A reporter agent synthesises the four reactions into a structured policy brief with distributional impact analysis and concrete recommendations. Results are validated against IFS published distributional findings.

Extended thinking is central to output quality: the archetypes don't produce generic policy commentary — they do the arithmetic against their own persona profile and cite specific numbers. The Streamlit UI streams the thinking tokens in real time, making the reasoning process visible. All runs persist as JSONL for replay without API calls.
