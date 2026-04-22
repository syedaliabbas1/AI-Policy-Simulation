"""IFS validation result badges."""

from typing import Any

import streamlit as st


def render_validation_panel(validation: dict[str, Any]) -> None:
    """Render pass/fail badges for each IFS validation check."""
    st.subheader("IFS Validation")

    if not validation:
        st.info("Validation results will appear after the brief is generated.")
        return

    checks = {
        "directional": "All archetypes net-negative",
        "ordering": "Low income < Pensioner < Urban professional",
        "concern_rationale_overlap": "IFS concerns referenced in rationale",
        "no_hallucinated_policy": "No invented policy details",
    }

    overall = validation.get("overall_pass", False)
    status_color = "#2e7d32" if overall else "#c62828"
    status_label = "PASS" if overall else "FAIL"

    st.markdown(
        f"<div style='display:inline-block;padding:4px 12px;border-radius:4px;"
        f"background:{status_color};color:white;font-weight:bold;margin-bottom:12px'>"
        f"Overall: {status_label}</div>",
        unsafe_allow_html=True,
    )

    cols = st.columns(len(checks))
    for col, (key, label) in zip(cols, checks.items()):
        result = validation.get(key, {})
        passed = result.get("pass", False) if isinstance(result, dict) else bool(result)
        icon = "+" if passed else "-"
        color = "#4caf50" if passed else "#f44336"
        with col:
            st.markdown(
                f"<div style='text-align:center;padding:6px;border-radius:4px;"
                f"border:1px solid {color};color:{color};font-size:0.85em'>"
                f"<strong>{icon}</strong><br>{label}</div>",
                unsafe_allow_html=True,
            )

    notes = validation.get("notes", [])
    if notes:
        with st.expander("Validation notes"):
            for note in notes:
                st.markdown(f"- {note}")
