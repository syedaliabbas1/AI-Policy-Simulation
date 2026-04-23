"""Edge TTS synthesis — async, cached per run."""

import asyncio
import logging
from pathlib import Path

log = logging.getLogger(__name__)

# Fallback voice if persona has none configured
_DEFAULT_VOICE = "en-GB-RyanNeural"

# Map archetype_id → voice_id (mirrors data/archetypes/*.json voice_id fields)
VOICE_MAP: dict[str, str] = {
    "low_income_worker":    "en-GB-LibbyNeural",
    "small_business_owner": "en-GB-ThomasNeural",
    "urban_professional":   "en-GB-SoniaNeural",
    "retired_pensioner":    "en-GB-RyanNeural",
}


async def synthesise(text: str, voice_id: str, output_path: Path) -> Path:
    """Synthesise text to MP3 via edge-tts and write to output_path.

    Returns the path on success. Raises on failure.
    """
    import edge_tts  # imported lazily so missing dep doesn't break CLI

    output_path.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, voice_id)
    await communicate.save(str(output_path))
    log.info("TTS written: %s (%d bytes)", output_path, output_path.stat().st_size)
    return output_path


async def synthesise_reaction(
    archetype_id: str,
    reaction: dict,
    audio_dir: Path,
    voice_id: str | None = None,
) -> Path | None:
    """Synthesise the immediate_impact line from a reaction dict.

    Writes to audio_dir/<archetype_id>.mp3.
    Returns the path, or None if synthesis fails (non-fatal).
    """
    text = reaction.get("immediate_impact", "")
    if not text:
        return None

    resolved_voice = voice_id or VOICE_MAP.get(archetype_id, _DEFAULT_VOICE)
    output_path = audio_dir / f"{archetype_id}.mp3"

    # Skip if already cached (replay mode)
    if output_path.exists():
        return output_path

    try:
        return await synthesise(text, resolved_voice, output_path)
    except Exception as exc:
        log.warning("TTS failed for %s: %s", archetype_id, exc)
        return None
