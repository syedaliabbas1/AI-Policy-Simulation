"""Prompt caching block constructor."""

from typing import Any


def make_cache_block(text: str, ttl: str = "5m") -> dict[str, Any]:
    """Wrap text as an ephemeral prompt-cached content block.

    ttl: cache lifetime — "5m" (default) or "1h". Use "1h" for static knowledge
    blocks that won't change between runs. Keep "5m" for run-varying content.
    """
    return {"type": "text", "text": text, "cache_control": {"type": "ephemeral", "ttl": ttl}}
