"""Streaming card for a single archetype — thinking block + reaction output."""

from typing import Any

import streamlit as st

_DISPLAY_NAMES = {
    "low_income_worker": "Sarah, 34 — Part-time care worker",
    "small_business_owner": "David, 48 — Small business owner",
    "retired_pensioner": "Margaret, 71 — Retired pensioner",
    "urban_professional": "James, 29 — Urban professional",
}

_STANCE_COLORS = {
    "strong_oppose": "#d32f2f",
    "oppose": "#f44336",
    "neutral": "#9e9e9e",
    "support": "#4caf50",
    "strong_support": "#2e7d32",
}


def _stance_label(score: float) -> tuple[str, str]:
    if score <= -0.6:
        return "Strongly Oppose", _STANCE_COLORS["strong_oppose"]
    if score <= -0.2:
        return "Oppose", _STANCE_COLORS["oppose"]
    if score <= 0.2:
        return "Neutral", _STANCE_COLORS["neutral"]
    if score <= 0.6:
        return "Support", _STANCE_COLORS["support"]
    return "Strongly Support", _STANCE_COLORS["strong_support"]


def render_agent_card(
    archetype_id: str,
    reaction: dict[str, Any] | None = None,
    thinking_placeholder: Any = None,
    reaction_placeholder: Any = None,
) -> None:
    """Render a complete archetype card. If reaction is None, renders empty skeleton."""
    display_name = _DISPLAY_NAMES.get(archetype_id, archetype_id)

    with st.container(border=True):
        st.markdown(f"**{display_name}**")

        if reaction is None:
            if thinking_placeholder is not None:
                thinking_placeholder.caption("Thinking...")
            if reaction_placeholder is not None:
                reaction_placeholder.empty()
            return

        score = reaction.get("support_or_oppose", 0.0)
        label, color = _stance_label(score)

        col1, col2 = st.columns([3, 1])
        with col1:
            st.markdown(f"**Immediate impact:** {reaction.get('immediate_impact', '')}")
            st.markdown(f"**Response:** {reaction.get('household_response', '')}")
        with col2:
            st.markdown(
                f"<div style='text-align:center;padding:8px;border-radius:6px;"
                f"background:{color};color:white;font-weight:bold'>"
                f"{label}<br><span style='font-size:1.4em'>{score:+.2f}</span></div>",
                unsafe_allow_html=True,
            )

        concerns = reaction.get("concerns", [])
        if concerns:
            with st.expander("Concerns"):
                for c in concerns:
                    st.markdown(f"- {c}")

        rationale = reaction.get("rationale", "")
        if rationale:
            with st.expander("Rationale"):
                st.markdown(f"*\"{rationale}\"*")
