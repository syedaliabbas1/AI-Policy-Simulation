"""Streamlit entry point for the Policy Simulation Platform."""

import sys
from pathlib import Path

# Ensure project root is on sys.path when Streamlit launches this file directly
_PROJECT_ROOT = Path(__file__).parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import asyncio
from typing import Any

import streamlit as st

from simulation.engine import RunCallbacks, SimulationEngine
from simulation.replay import replay_run
from simulation.validation import validate_run

from app.components.agent_card import render_agent_card
from app.components.brief_display import render_brief_display
from app.components.policy_input import render_policy_input
from app.components.validation_panel import render_validation_panel

_RUNS_ROOT = _PROJECT_ROOT / "simulation_runs"
_IFS_PATH = _PROJECT_ROOT / "knowledge_base" / "fiscal" / "ifs_2011_validation.json"

_ARCHETYPE_IDS = [
    "low_income_worker",
    "small_business_owner",
    "retired_pensioner",
    "urban_professional",
]

st.set_page_config(
    page_title="Policy Simulation Platform",
    layout="wide",
    initial_sidebar_state="expanded",
)


def _get_engine() -> SimulationEngine:
    if "engine" not in st.session_state:
        st.session_state["engine"] = SimulationEngine(runs_root=_RUNS_ROOT)
    return st.session_state["engine"]


def _init_run_state() -> None:
    defaults = {
        "run_id": None,
        "reactions": {},
        "brief_text": "",
        "validation": {},
        "phase": "idle",  # idle | briefing | reacting | reporting | done
        "thinking_buffers": {aid: "" for aid in _ARCHETYPE_IDS},
        "replay_run_id": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


def _run_live(scenario_path: Path) -> None:
    engine = _get_engine()
    state = engine.init_run(scenario_path)
    run_id = state["run_id"]
    st.session_state["run_id"] = run_id
    st.session_state["reactions"] = {}
    st.session_state["brief_text"] = ""
    st.session_state["validation"] = {}
    st.session_state["thinking_buffers"] = {aid: "" for aid in _ARCHETYPE_IDS}

    placeholders: dict[str, Any] = {}
    for aid in _ARCHETYPE_IDS:
        placeholders[f"thinking_{aid}"] = st.empty()
        placeholders[f"reaction_{aid}"] = st.empty()
    brief_placeholder = st.empty()

    thinking_parts: dict[str, list[str]] = {aid: [] for aid in _ARCHETYPE_IDS}
    brief_parts: list[str] = []

    async def on_thinking(aid: str, token: str) -> None:
        thinking_parts[aid].append(token)
        placeholders[f"thinking_{aid}"].caption("".join(thinking_parts[aid])[-300:])

    async def on_reaction_delta(aid: str, token: str) -> None:
        placeholders[f"reaction_{aid}"].caption("Reacting...")

    async def on_brief(token: str) -> None:
        brief_parts.append(token)
        brief_placeholder.markdown("".join(brief_parts))

    callbacks = RunCallbacks(
        on_thinking={aid: lambda t, a=aid: on_thinking(a, t) for aid in _ARCHETYPE_IDS},
        on_reaction_delta={aid: lambda t, a=aid: on_reaction_delta(a, t) for aid in _ARCHETYPE_IDS},
        on_brief_text=on_brief,
    )

    async def _pipeline() -> tuple[dict, str]:
        await engine.brief(run_id)
        reactions = await engine.react_parallel(run_id, callbacks=callbacks)
        brief_text = await engine.report(run_id, on_brief_text=on_brief)
        return reactions, brief_text

    with st.spinner("Running simulation..."):
        reactions, brief_text = asyncio.run(_pipeline())

    for ph in placeholders.values():
        ph.empty()
    brief_placeholder.empty()

    st.session_state["reactions"] = reactions
    st.session_state["brief_text"] = brief_text

    validation = validate_run(
        run_dir=_RUNS_ROOT / run_id,
        ifs_data_path=_IFS_PATH,
    )
    st.session_state["validation"] = validation
    st.session_state["phase"] = "done"


def _run_replay(replay_run_id: str) -> None:
    thinking_parts: dict[str, list[str]] = {aid: [] for aid in _ARCHETYPE_IDS}

    placeholders: dict[str, Any] = {}
    for aid in _ARCHETYPE_IDS:
        placeholders[f"thinking_{aid}"] = st.empty()

    async def on_event(archetype_id: str, event_type: str, token: str) -> None:
        if event_type == "thinking":
            thinking_parts[archetype_id].append(token)
            placeholders[f"thinking_{archetype_id}"].caption(
                "".join(thinking_parts[archetype_id])[-300:]
            )

    with st.spinner(f"Replaying run {replay_run_id}..."):
        reactions = asyncio.run(
            replay_run(
                run_id=replay_run_id,
                runs_root=_RUNS_ROOT,
                on_event=on_event,
                delay_ms=15,
            )
        )

    for ph in placeholders.values():
        ph.empty()

    st.session_state["reactions"] = reactions
    brief_path = _RUNS_ROOT / replay_run_id / "brief.md"
    st.session_state["brief_text"] = brief_path.read_text(encoding="utf-8") if brief_path.exists() else ""

    validation_path = _RUNS_ROOT / replay_run_id / "validation.json"
    if validation_path.exists():
        import json
        st.session_state["validation"] = json.loads(validation_path.read_text(encoding="utf-8"))
    else:
        validation = validate_run(
            run_dir=_RUNS_ROOT / replay_run_id,
            ifs_data_path=_IFS_PATH,
        )
        st.session_state["validation"] = validation

    st.session_state["phase"] = "done"


def main() -> None:
    _init_run_state()

    st.title("UK Fiscal Policy Simulation")
    st.caption("Powered by Claude Opus 4.7 with extended thinking")

    with st.sidebar:
        scenario_path, mode = render_policy_input()

        st.divider()
        run_clicked = st.button(
            "Run Simulation" if mode == "live" else "Replay",
            type="primary",
            disabled=scenario_path is None,
            use_container_width=True,
        )

        if st.session_state.get("run_id"):
            st.caption(f"Run: `{st.session_state['run_id']}`")

    if run_clicked:
        if mode == "live" and scenario_path:
            _run_live(scenario_path)
            st.rerun()
        elif mode == "replay":
            replay_id = st.session_state.get("replay_run_id")
            if replay_id:
                _run_replay(replay_id)
                st.rerun()
            else:
                st.sidebar.error("Select a run to replay.")

    # --- Results layout ---
    reactions = st.session_state.get("reactions", {})
    brief_text = st.session_state.get("brief_text", "")
    validation = st.session_state.get("validation", {})
    phase = st.session_state.get("phase", "idle")

    if phase == "idle":
        st.info("Select a scenario and click Run Simulation to begin.")
        return

    # Archetype cards — 2x2 grid
    st.subheader("Archetype Reactions")
    row1, row2 = st.columns(2), st.columns(2)
    grid = [row1[0], row1[1], row2[0], row2[1]]
    for col, aid in zip(grid, _ARCHETYPE_IDS):
        with col:
            render_agent_card(aid, reaction=reactions.get(aid))

    st.divider()

    col_brief, col_validation = st.columns([2, 1])
    with col_brief:
        render_brief_display(brief_text, reactions)
    with col_validation:
        render_validation_panel(validation)


if __name__ == "__main__":
    main()
