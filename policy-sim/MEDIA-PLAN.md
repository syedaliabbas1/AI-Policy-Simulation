# Media & Voice Plan — Voices, Portraits, Focus-Group UI, (later) Lip-Sync

**Status:** approved 2026-04-23 (Day 2 of 5). Implementation starts with vertical slice.
**Scope:** the "wow-factor" media layer on top of the base simulation.
**Parent plan:** `../IMPLEMENTATION-PLAN.md` — read that first; this file adds the media/voice layer to it and does not replace it.

---

## For a fresh session picking this up

You are likely a Sonnet 4.6 session with Opus 4.7 available via the `advisor()` tool.

1. **Read `../IMPLEMENTATION-PLAN.md` first.** It is the whole-project source of truth. Do not re-plan the project.
2. **Read this file top to bottom.** Do not re-plan the media layer.
3. **Recreate the task list in your session** from the numbered items in §v1 build order and §v2 build order. Prior task lists do NOT transfer.
4. **Check current progress before starting:**
   - `ls policy-sim/data/archetypes/portraits/` — how many PNGs exist
   - `grep voice_id policy-sim/data/archetypes/*.json` — how many personas have a voice assigned
   - `ls policy-sim/simulation_runs/*/audio/ 2>/dev/null` — whether any runs have audio
   - `grep -l edge_tts policy-sim/simulation/*.py` — whether TTS is wired in
5. **Call `advisor()` at the mandated checkpoints** (see §Advisor checkpoints). Opus 4.7 sees your full conversation and has written this plan — it knows what to check.
6. **Follow user's global CLAUDE.md:** opinionated recommendations with tradeoffs, ask before changing direction, no emojis in code, no Generated-with-Claude attribution in commits.

If a live user instruction conflicts with this plan, the live instruction wins — update this file to reflect the change before continuing.

---

## Decisions locked (do not revisit without user approval)

1. **Stack:** `edge-tts` (Python) for voices, FLUX.2 via free Hugging Face Space for portraits (one-time, offline from runtime), Streamlit for UI, `ffmpeg` kept available for v2 compositing.
2. **No paid services.** Anthropic API is the only paid dependency in the project.
3. **Vertical slice first.** Build Sarah end-to-end before fanning out to 4 archetypes. This rule applies to v1 AND v2.
4. **v1 does NOT include lip-sync.** CSS pulse/breathing animation on the portrait while audio plays. This was advisor-informed — voices + portraits carry the demo; judges watching a 3-minute video will not forensically inspect lip-sync.
5. **v2 will ship** (deferred, not abandoned). Adds Rhubarb Lip Sync + pre-rendered MP4 per utterance.
6. **Sync mechanism for v2 = Option A (pre-render MP4 via ffmpeg).** Do NOT use `st.components.v1.html()` + JS timer. This was pressure-tested with the advisor — Streamlit has no clean primitive for live audio↔image sync and the HTML-component path causes cascading complexity.
7. **Portrait style:** stylized / illustrated, not photoreal. Keeps mouth-region consistent across archetypes (needed for v2 overlay alignment) and avoids uncanny-valley.
8. **Voice set:** UK regional neural voices from edge-tts. Mapping in §Voice assignment.
9. **Asset commitment:** portraits committed to repo. Audio mp3s + SRT files written under `simulation_runs/<id>/audio/` (gitignored, reproducible from cached reactions).
10. **Repo asset budget:** ≤ 30 MB for all committed media. Portraits + any v2 mouth SVGs + rhubarb binary (Windows) should fit well under this.
11. **Caching + replay:** edge-tts audio is cached per-run; replay reads cached files, zero network calls to TTS in replay mode.

---

## What's in v1 (build these)

### Voice assignment

| Archetype | `voice_id` | Why |
|---|---|---|
| `low_income_worker` (Sarah, 34, North East) | `en-GB-LibbyNeural` | young female, approachable |
| `small_business_owner` (David) | `en-GB-ThomasNeural` | middle-aged male, practical |
| `urban_professional` (James) | `en-GB-RyanNeural` | clear RP, professional |
| `retired_pensioner` (Margaret) | `en-GB-SoniaNeural` | mature female warmth |
| Reporter (final brief narration) | `en-GB-RyanNeural` | neutral, authoritative |

If any voice sounds wrong after a listen test, swap from the `en-GB-*Neural` set and flag the swap to the user before committing.

### Portrait prompt template (for FLUX.2 via HF Space)

Generated once per archetype using a free Hugging Face Space (e.g. `black-forest-labs/FLUX.1-schnell`). Composition must be consistent across all four so v2 mouth-overlay alignment works.

```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
[PERSONA_DESCRIPTOR], vertical 3:4 aspect ratio
```

Per-archetype `[PERSONA_DESCRIPTOR]` (adjust to taste during generation):
- Sarah: `34-year-old white British woman, part-time carer, tired but warm, subtle winter scarf`
- David: `48-year-old British small-business owner, casual shirt, slight smile, practical look`
- James: `32-year-old urban professional, light blue shirt, clean-cut, confident`
- Margaret: `72-year-old British retiree, greying hair, kind eyes, knitted cardigan`

**Do not use photoreal prompts.** Stylized is locked by decision #7.

### v1 build order (numbered for task tracking)

**Phase A — Vertical slice (Sarah only)**
1. Add `edge-tts` to `requirements.txt`.
2. Add `"voice_id": "en-GB-LibbyNeural"` to `data/archetypes/low_income_worker.json`.
3. Generate Sarah's portrait via FLUX.2 HF Space using the shared template. Commit PNG to `data/archetypes/portraits/low_income_worker.png` (≈3:4, ≤500 KB, PNG or WebP).
4. Create `simulation/tts.py`: `async def synthesize(text: str, voice_id: str, out_mp3: Path, out_srt: Path)` using `edge_tts.Communicate`, emitting both mp3 and SRT subtitles.
5. Hook into `simulation/engine.py`: after an archetype's `Reaction` tool call finalizes, call `synthesize()` on the `rationale` field (or a concatenation of `immediate_impact` + `household_response` + `rationale` — decide during build, keep consistent). Write to `simulation_runs/<id>/audio/{archetype}.{mp3,srt}`. All four archetypes' TTS calls wrapped in the existing `asyncio.gather`.
6. Update `app/components/agent_card.py`: portrait at top of card, name + region label, thinking-stream text as translucent overlay during the thinking phase, audio player with CSS pulse/breathing while playing, SRT caption rendered below the audio.
7. Verify Sarah end-to-end: one run → one card with portrait + visible thinking → audio plays with caption + pulse.

**→ Call `advisor()` here before fan-out.**

**Phase B — Fan-out (remaining 3 archetypes)**
8. Add `voice_id` to the other three persona JSONs per the voice assignment table.
9. Generate 3 more portraits with the same prompt template. Commit PNGs to `data/archetypes/portraits/`.
10. Confirm `asyncio.gather` parallelises all 4 TTS calls correctly. Measure added latency over baseline (target ≤ 15s added).
11. Update `app/main.py` to render a 2×2 focus-group grid.

**Phase C — Polish**
12. Inner-monologue rendering: translucent thinking text above each portrait during the thinking phase, fades out when audio playback begins.
13. Reporter narration (closing beat): synthesize the final brief summary in `en-GB-RyanNeural`, play over the support/oppose chart in `app/components/brief_display.py`.
14. Verify replay mode plays all cached audio without network calls. Confirm existing CLI + engine tests still pass.

**→ Call `advisor()` before declaring v1 complete.**

---

## What's in v2 (deferred — will ship after v1 is airtight and user signs off)

v2 adds Rhubarb-driven lip-sync via pre-rendered MP4 per utterance. Do NOT start v2 until v1 passes §v1 verification and the user approves proceeding.

### v2 build order

1. Download Rhubarb CLI binary for Windows; commit to `assets/bin/rhubarb.exe` (≈30 MB). Add setup note to README for macOS/Linux users (download from https://github.com/DanielSWolf/rhubarb-lip-sync/releases and place in `assets/bin/`).
2. Add `ffmpeg` as a required local dependency (README setup note; don't commit binary — too large).
3. Draw or generate 9 mouth-shape SVG overlays: `A` (closed), `B` (slight teeth), `C` (EH), `D` (AA open), `E` (AO rounded), `F` (UW puckered), `G`, `H`, `X` (rest). Shared across all archetypes — same style per portrait style. Commit to `assets/mouths/`.
4. Create `simulation/lipsync.py`:
   - `rhubarb_cues(wav_path: Path, dialog_text: str) -> list[MouthCue]` — uses `--dialogFile` for better phoneme accuracy.
   - `compose_video(portrait_png: Path, mouth_svgs: Path, audio_mp3: Path, cues: list[MouthCue], out_mp4: Path)` — ffmpeg composite.
5. Extend `simulation/tts.py` pipeline to also produce `.wav` (ffmpeg conversion from `.mp3` — Rhubarb needs WAV or Ogg).
6. Vertical slice: Sarah's MP4 pipeline end-to-end. Verify lip movement alignment visually.
7. **→ Call `advisor()` after Sarah's MP4 slice before fanning out.**
8. Fan out to remaining 3 archetypes.
9. Switch `app/components/agent_card.py` from `st.audio` + pulse to `st.video` showing the pre-rendered MP4.
10. **→ Call `advisor()` before declaring v2 complete.**

### v2 locked specifics

- **Sync mechanism:** Option A (pre-render MP4). Do NOT change to HTML-component sync.
- **Rhubarb dialog hint:** always pass `--dialogFile <path>` with the known reaction text. Free phoneme accuracy.
- **Pre-render caching:** MP4s land in `simulation_runs/<id>/video/` alongside audio. Replay plays the cached MP4s.
- **Per-archetype MP4 budget:** ≤ 2 MB. If larger, drop framerate or resolution before cutting quality elsewhere.

---

## Out of scope (stays out)

- Photoreal portraits
- Real-time streaming TTS (token-level speaking as archetype generates)
- Custom HTML/JS component for audio↔image sync
- Paid TTS / video (ElevenLabs, MiniMax, HeyGen, D-ID, Sync.so, etc.)
- Live microphone input from the judge
- Emotion / expression variation beyond the mouth
- Multiple portrait angles per archetype
- Regenerating portraits per run

---

## Advisor checkpoints (mandatory)

Opus 4.7 is available via the `advisor()` tool. The advisor sees the full conversation. Call it at these specific moments — do not skip.

| When | Why |
|---|---|
| Before writing the first line of v1 code | Pressure-test the approach vs. what this plan says |
| After Phase A step 7 (Sarah vertical slice done) | Review integration quality before fan-out multiplies any issues |
| Before declaring v1 complete (after Phase C) | Catch anything missing against v1 pass criteria |
| Before starting v2 | Confirm v1 is airtight and the deferred scope is still correct |
| After v2 Sarah MP4 slice | Same integration-quality gate as Phase A |
| Before declaring v2 complete | Final verification |

If stuck (errors recurring, approach not converging), also call advisor — do not keep pushing.

---

## Verification

### v1 pass criteria
- `streamlit run app/main.py` renders a 2×2 focus-group grid with 4 portraits.
- A fresh VAT-2010 run produces 4 mp3 files + 4 SRT files under `simulation_runs/<id>/audio/`.
- Each card plays its audio with visible pulse animation and SRT caption rendered below.
- Thinking text renders as translucent overlay during thinking phase, fades when audio begins.
- Reporter narration plays over the final brief chart.
- Replay mode plays all cached audio without network calls.
- Total added latency over the text-only baseline ≤ 15 seconds.
- All existing CLI + engine tests pass.
- No new paid dependencies introduced.

### v2 pass criteria
- Everything in v1, plus:
- Each card now shows a pre-rendered MP4 with visible lip movement synced to audio.
- Rhubarb produces cues for any novel policy input (dynamic policy test).
- MP4 files ≤ 2 MB each.
- `--replay` plays cached MP4s with zero network calls to TTS or rhubarb.

---

## Files touched

### New (v1)
- `simulation/tts.py`
- `data/archetypes/portraits/{low_income_worker,small_business_owner,urban_professional,retired_pensioner}.png`
- `simulation_runs/<id>/audio/*.{mp3,srt}` — runtime-generated, gitignored

### New (v2)
- `simulation/lipsync.py`
- `assets/bin/rhubarb.exe` (Windows; README note for other OSes)
- `assets/mouths/{A,B,C,D,E,F,G,H,X}.svg`
- `simulation_runs/<id>/video/*.mp4` — runtime-generated, gitignored

### Modified (v1)
- `requirements.txt` — add `edge-tts`
- `data/archetypes/*.json` — add `voice_id` field
- `simulation/engine.py` — call TTS in archetype react path
- `app/components/agent_card.py` — portrait + audio + caption + thinking overlay
- `app/main.py` — 2×2 grid layout
- `app/components/brief_display.py` — reporter narration over chart

### Modified (v2)
- `requirements.txt` — confirm nothing new needed (ffmpeg is a system dep)
- `simulation/tts.py` — also emit WAV for rhubarb
- `app/components/agent_card.py` — switch to `st.video`
- `README.md` — setup note for rhubarb + ffmpeg

### Do not touch
- `simulation/utils.py`, `simulation/observers/base.py` — stable, ported verbatim from `agentic-bo/`.
- `simulation/validation.py` — IFS directional comparison; unrelated to media.

---

## Open questions (resolve with user if they come up, don't decide alone)

- If an edge-tts voice sounds wrong on listen test → swap from the UK-en Neural set? (Default: yes, flag the swap before committing.)
- If a judge's machine can't reach MS Edge TTS during a live new-policy demo → fall back to Piper TTS locally? (Default: out of scope for v1/v2. Note as possible v3 mitigation only.)
- If portrait generation on a free HF Space is rate-limited → generate locally via `diffusers` instead? (Default: try HF Space first; only go local if blocked.)

---

## Dynamic-policy audit (confirmed correct)

The stack handles arbitrary new policies without pre-baking:
- Reactions are Claude-generated → always fresh text.
- edge-tts synthesises any text → always fresh mp3 (requires internet — acceptable, same as Anthropic API).
- (v2) Rhubarb processes any mp3 → always fresh cues.
- Portraits + voice selections are fixed per archetype, independent of policy content.
- Pre-baked artifacts are only the 4 portraits (one-time) and cached runs for demo replay.

No content is locked to the VAT-2010 scenario beyond the demo video recording.
