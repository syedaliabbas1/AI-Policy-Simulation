"""Policy simulation CLI — init / run / report / replay commands."""

import argparse
import asyncio
import json
import sys
from pathlib import Path

from .engine import RunCallbacks, SimulationEngine
from .replay import replay_run
from .validation import validate_run


# ------------------------------------------------------------------
# Command registration
# ------------------------------------------------------------------

def register_commands(sub: argparse._SubParsersAction) -> None:
    init_p = sub.add_parser("init", help="Initialise a run from a scenario file")
    init_p.add_argument("--scenario", required=True, help="Path to scenario .md file")
    init_p.add_argument("--runs-root", default="simulation_runs", help="Runs directory")

    run_p = sub.add_parser("run", help="Execute full pipeline for an initialised run")
    run_p.add_argument("--run-id", required=True)
    run_p.add_argument("--runs-root", default="simulation_runs")

    report_p = sub.add_parser("report", help="Regenerate brief.md from existing artifacts")
    report_p.add_argument("--run-id", required=True)
    report_p.add_argument("--runs-root", default="simulation_runs")

    replay_p = sub.add_parser("replay", help="Replay a completed run from JSONL artifacts")
    replay_p.add_argument("--run-id", required=True)
    replay_p.add_argument("--runs-root", default="simulation_runs")
    replay_p.add_argument("--delay-ms", type=int, default=25, help="Token pacing delay in ms")

    validate_p = sub.add_parser("validate", help="Run IFS directional validation on a completed run")
    validate_p.add_argument("--run-id", required=True)
    validate_p.add_argument("--runs-root", default="simulation_runs")

    status_p = sub.add_parser("status", help="Show run status")
    status_p.add_argument("--run-id", required=True)
    status_p.add_argument("--runs-root", default="simulation_runs")


# ------------------------------------------------------------------
# Command handlers
# ------------------------------------------------------------------

def handle(args: argparse.Namespace) -> int:
    command = args.command

    if command == "init":
        engine = SimulationEngine(runs_root=args.runs_root)
        state = engine.init_run(args.scenario)
        print(json.dumps(state, indent=2))
        print(f"\nRun initialised: {state['run_id']}", file=sys.stderr)
        return 0

    if command == "run":
        engine = SimulationEngine(runs_root=args.runs_root)

        async def _print_token(token: str) -> None:
            print(token, end="", flush=True)

        async def _print_thinking(token: str) -> None:
            print(f"\033[90m{token}\033[0m", end="", flush=True)

        archetype_ids = [p["id"] for p in engine._personas]
        callbacks = RunCallbacks(
            on_supervisor_text=_print_token,
            on_thinking={aid: _print_thinking for aid in archetype_ids},
            on_reaction_delta={aid: _print_token for aid in archetype_ids},
            on_brief_text=_print_token,
        )

        print(f"[supervisor] generating briefings...", file=sys.stderr)
        result = asyncio.run(engine.run_pipeline(args.run_id, callbacks=callbacks))
        print(f"\n\n[done] run_id={result['run_id']} brief_length={result['brief_length']}", file=sys.stderr)
        return 0

    if command == "report":
        engine = SimulationEngine(runs_root=args.runs_root)

        async def _run() -> None:
            async def _print(token: str) -> None:
                print(token, end="", flush=True)
            await engine.report(args.run_id, on_brief_text=_print)

        asyncio.run(_run())
        print(file=sys.stderr)
        return 0

    if command == "replay":
        engine = SimulationEngine(runs_root=args.runs_root)

        async def _run() -> None:
            async def _print_token(archetype_id: str, event_type: str, token: str) -> None:
                if event_type == "thinking":
                    print(f"\033[90m{token}\033[0m", end="", flush=True)
                else:
                    print(token, end="", flush=True)

            await replay_run(
                run_id=args.run_id,
                runs_root=Path(args.runs_root),
                on_event=_print_token,
                delay_ms=args.delay_ms,
            )

        asyncio.run(_run())
        print(file=sys.stderr)
        return 0

    if command == "validate":
        engine = SimulationEngine(runs_root=args.runs_root)
        result = validate_run(
            run_dir=engine._paths(args.run_id).run_dir,
            ifs_data_path=Path(__file__).parent.parent / "knowledge_base" / "fiscal" / "ifs_2011_validation.json",
        )
        print(json.dumps(result, indent=2))
        overall = "PASS" if result.get("overall_pass") else "FAIL"
        print(f"\nValidation: {overall}", file=sys.stderr)
        return 0 if result.get("overall_pass") else 1

    if command == "status":
        engine = SimulationEngine(runs_root=args.runs_root)
        print(json.dumps(engine.status(args.run_id), indent=2))
        return 0

    return 1


# ------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Policy simulation CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    register_commands(sub)
    return parser


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = build_parser()
    args = parser.parse_args(argv)
    return handle(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
