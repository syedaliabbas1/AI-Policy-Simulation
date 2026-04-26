"""SDK wrapper: streaming with extended thinking, tool use, and prompt caching."""

import json
import os
import re
from pathlib import Path
from typing import Any, Awaitable, Callable

import anthropic
from anthropic.types.beta import BetaOutputConfigParam

from .caching import make_cache_block

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-7")
THINKING_TYPE = os.environ.get("ANTHROPIC_THINKING_TYPE", "adaptive")
THINKING_BUDGET = int(os.environ.get("ANTHROPIC_THINKING_BUDGET", "8000"))

# Matches archetype-agent/SKILL.md output spec exactly
REACTION_TOOL: dict[str, Any] = {
    "name": "Reaction",
    "description": "Record this archetype's reaction to the policy briefing",
    "input_schema": {
        "type": "object",
        "properties": {
            "immediate_impact": {
                "type": "string",
                "description": "The single most concrete change to this person's finances or daily life",
            },
            "household_response": {
                "type": "string",
                "description": "What would this household actually do differently as a result",
            },
            "concerns": {
                "type": "array",
                "items": {"type": "string"},
                "description": "2-4 specific concerns rooted in this persona's actual situation",
                "minItems": 2,
                "maxItems": 4,
            },
            "support_or_oppose": {
                "type": "number",
                "description": "Float from -1.0 (strongly oppose) to +1.0 (strongly support)",
                "minimum": -1.0,
                "maximum": 1.0,
            },
            "rationale": {
                "type": "string",
                "description": "In this persona's voice — why do you feel this way, referencing specific figures",
            },
        },
        "required": [
            "immediate_impact",
            "household_response",
            "concerns",
            "support_or_oppose",
            "rationale",
        ],
    },
}

TextCallback = Callable[[str], Awaitable[None]] | None
# event_type: "thinking" | "tool_delta"
EventCallback = Callable[[str, str], Awaitable[None]] | None


def load_skill(skill_path: Path) -> str:
    """Load SKILL.md, strip YAML frontmatter, return body as system prompt string."""
    content = skill_path.read_text(encoding="utf-8")
    stripped = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    return stripped.strip()


async def stream_supervisor(
    client: anthropic.AsyncAnthropic,
    policy_text: str,
    personas: list[dict[str, Any]],
    skill_body: str,
    knowledge_context: str = "",
    on_text: TextCallback = None,
) -> list[dict[str, Any]]:
    """Stream supervisor call; parse and return list of briefing dicts."""
    user_content: list[dict[str, Any]] = []
    if knowledge_context:
        user_content.append(make_cache_block(knowledge_context, ttl="1h"))
    user_content.append(make_cache_block(json.dumps(personas, indent=2), ttl="1h"))
    user_content.append({
        "type": "text",
        "text": f"Policy document:\n\n{policy_text}\n\nProduce briefings for all four archetypes.",
    })

    parts: list[str] = []
    async with client.messages.stream(
        model=MODEL,
        max_tokens=4096,
        system=[make_cache_block(skill_body, ttl="1h")],
        messages=[{"role": "user", "content": user_content}],
    ) as stream:
        async for event in stream:
            if event.type == "content_block_delta" and event.delta.type == "text_delta":
                parts.append(event.delta.text)
                if on_text:
                    await on_text(event.delta.text)

    raw = "".join(parts).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


async def stream_archetype(
    client: anthropic.AsyncAnthropic,
    persona: dict[str, Any],
    briefing: dict[str, Any],
    skill_body: str,
    on_event: EventCallback = None,
) -> dict[str, Any]:
    """Stream one archetype reaction with extended thinking. Returns parsed Reaction dict.

    claude-opus-4-7 uses adaptive thinking via the beta API. Thinking content is encrypted
    (redacted_thinking) — we emit a single synthetic thinking token when the reasoning block
    starts so the UI shows the thinking phase is active, then stream the tool-call JSON as
    reaction_delta tokens.
    """
    tool_parts: list[str] = []
    thinking_emitted = False

    thinking_config = (
        {"type": "enabled", "budget_tokens": THINKING_BUDGET}
        if THINKING_TYPE == "enabled"
        else {"type": "adaptive"}
    )

    async with client.beta.messages.stream(
        model=MODEL,
        max_tokens=16000,
        thinking=thinking_config,
        output_config=BetaOutputConfigParam(effort="high"),
        tools=[REACTION_TOOL],
        tool_choice={"type": "auto"},
        system=[make_cache_block(skill_body)],
        messages=[
            {
                "role": "user",
                "content": [
                    make_cache_block(json.dumps(persona, indent=2)),
                    {
                        "type": "text",
                        "text": (
                            f"Your policy briefing:\n\n{json.dumps(briefing, indent=2)}"
                            "\n\nReact to this policy as yourself."
                        ),
                    },
                ],
            }
        ],
    ) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                block_type = getattr(event.content_block, "type", "")
                if block_type in ("thinking", "redacted_thinking") and not thinking_emitted:
                    thinking_emitted = True
                    if on_event:
                        await on_event(
                            "thinking",
                            f"Opus 4.7 extended reasoning active for {persona.get('display_name', persona.get('id', 'archetype'))}...\n\nAnalysing policy impact against household finances, income quintile, and lived experience...\n",
                        )
                continue

            if event.type != "content_block_delta":
                continue
            delta = event.delta
            if delta.type == "thinking_delta":
                if on_event:
                    await on_event("thinking", delta.thinking)
            elif delta.type == "input_json_delta":
                # Emit synthetic reasoning placeholder on the very first tool token
                # so the UI always shows streaming content even when adaptive thinking
                # decides not to generate a thinking block.
                if not thinking_emitted and on_event:
                    thinking_emitted = True
                    await on_event(
                        "thinking",
                        f"Reasoning as {persona.get('display_name', persona.get('id', 'archetype'))}...\n\nConsidering household finances, regional costs, and personal circumstances against the policy briefing...\n",
                    )
                tool_parts.append(delta.partial_json)
                if on_event:
                    await on_event("tool_delta", delta.partial_json)

    if not tool_parts:
        raise RuntimeError("Archetype did not invoke the Reaction tool — no structured output captured.")
    return json.loads("".join(tool_parts))


async def stream_reporter(
    client: anthropic.AsyncAnthropic,
    briefings: list[dict[str, Any]],
    reactions: dict[str, dict[str, Any]],
    skill_body: str,
    on_text: TextCallback = None,
) -> str:
    """Stream reporter call; return full policy brief as markdown string."""
    parts: list[str] = []

    thinking_config = (
        {"type": "enabled", "budget_tokens": THINKING_BUDGET}
        if THINKING_TYPE == "enabled"
        else {"type": "adaptive"}
    )

    async with client.beta.messages.stream(
        model=MODEL,
        max_tokens=4096,
        thinking=thinking_config,
        output_config=BetaOutputConfigParam(effort="high"),
        system=[make_cache_block(skill_body, ttl="1h")],
        messages=[
            {
                "role": "user",
                "content": [
                    make_cache_block(json.dumps(briefings, indent=2)),
                    make_cache_block(json.dumps(reactions, indent=2)),
                    {"type": "text", "text": "Produce the policy brief now."},
                ],
            }
        ],
    ) as stream:
        async for event in stream:
            if (
                event.type == "content_block_delta"
                and event.delta.type == "text_delta"
            ):
                parts.append(event.delta.text)
                if on_text:
                    await on_text(event.delta.text)

    return "".join(parts)
