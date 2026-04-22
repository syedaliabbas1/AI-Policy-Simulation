"""Policy brief renderer with support/oppose bar chart."""

from typing import Any

import streamlit as st


def render_brief_display(brief_text: str, reactions: dict[str, dict[str, Any]]) -> None:
    """Render the reporter's markdown brief and a stance bar chart."""
    st.subheader("Policy Brief")

    if brief_text:
        st.markdown(brief_text)
    else:
        st.info("Brief will appear here once the simulation completes.")
        return

    if reactions:
        st.subheader("Stance Overview")
        _render_stance_chart(reactions)


def _render_stance_chart(reactions: dict[str, dict[str, Any]]) -> None:
    labels = {
        "low_income_worker": "Low income",
        "small_business_owner": "Small biz",
        "retired_pensioner": "Pensioner",
        "urban_professional": "Urban prof",
    }
    data = {
        "Archetype": [labels.get(k, k) for k in reactions],
        "Stance": [v.get("support_or_oppose", 0.0) for v in reactions.values()],
    }

    try:
        import altair as alt
        import pandas as pd

        df = pd.DataFrame(data)
        chart = (
            alt.Chart(df)
            .mark_bar()
            .encode(
                x=alt.X("Archetype:N", axis=alt.Axis(labelAngle=0)),
                y=alt.Y("Stance:Q", scale=alt.Scale(domain=[-1, 1])),
                color=alt.condition(
                    alt.datum["Stance"] > 0,
                    alt.value("#4caf50"),
                    alt.value("#f44336"),
                ),
                tooltip=["Archetype", "Stance"],
            )
            .properties(height=200)
        )
        st.altair_chart(chart, width="stretch")
    except ImportError:
        st.bar_chart({"Stance": {labels.get(k, k): v.get("support_or_oppose", 0) for k, v in reactions.items()}})
