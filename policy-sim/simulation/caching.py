"""Prompt caching block constructor."""

from typing import Any


def make_cache_block(text: str) -> dict[str, Any]:
    """Wrap text as an ephemeral prompt-cached content block."""
    return {"type": "text", "text": text, "cache_control": {"type": "ephemeral"}}
