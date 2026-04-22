"""Scenario picker and run-mode toggle."""

from pathlib import Path

import streamlit as st

_KB = Path(__file__).parent.parent.parent / "knowledge_base" / "fiscal"

_LABELS = {
    "uk_vat_2010.md": "UK VAT Rise 2010 (17.5% → 20%)",
    "uk_vat_cut_hypothetical.md": "Hypothetical VAT Cut (20% → 15%)",
}


def render_policy_input() -> tuple[Path | None, str]:
    """Render scenario picker + mode toggle. Returns (scenario_path, mode)."""
    st.subheader("Policy Scenario")

    scenario_files = sorted(_KB.glob("*.md"))
    if not scenario_files:
        st.error("No scenario files found in knowledge_base/fiscal/")
        return None, "live"

    options = [f.name for f in scenario_files]
    labels = [_LABELS.get(n, n) for n in options]
    label_to_file = dict(zip(labels, scenario_files))

    selected_label = st.selectbox("Select scenario", labels)
    selected_path = label_to_file[selected_label]

    mode = st.radio("Mode", ["Live (API)", "Replay"], horizontal=True, label_visibility="collapsed")
    mode_key = "live" if mode == "Live (API)" else "replay"

    if mode_key == "replay":
        runs_root = Path(__file__).parent.parent.parent / "simulation_runs"
        completed = [
            d.name for d in sorted(runs_root.iterdir(), reverse=True)
            if (d / "state.json").exists() and any((d / "reactions").glob("*.jsonl"))
        ] if runs_root.exists() else []

        if not completed:
            st.warning("No completed runs found. Switch to Live mode to run a simulation.")
            return selected_path, "replay"

        replay_id = st.selectbox("Select run to replay", completed)
        st.session_state["replay_run_id"] = replay_id

    return selected_path, mode_key
