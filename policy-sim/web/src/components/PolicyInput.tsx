import { useEffect, useState } from "react"
import { listScenarios, type Scenario } from "@/lib/api"
import type { Phase } from "@/hooks/useRunStream"

interface Props {
  phase: Phase
  onRun: (scenarioPath: string, replay: boolean, replayRunId?: string) => void
  onStop: () => void
}

const DEMO_RUN_ID = "rapid-heron-2827"

export function PolicyInput({ phase, onRun, onStop }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selected, setSelected] = useState("")
  const [mode, setMode] = useState<"live" | "replay">("replay")
  const running = phase !== "idle" && phase !== "done" && phase !== "error"

  useEffect(() => {
    listScenarios()
      .then((s) => {
        setScenarios(s)
        const vat = s.find((x) => x.name.includes("uk_vat_2010")) ?? s[0]
        if (vat) setSelected(vat.path)
      })
      .catch(() => {
        setSelected("knowledge_base/fiscal/uk_vat_2010.md")
      })
  }, [])

  function handleRun() {
    if (running) { onStop(); return }
    if (mode === "replay") {
      onRun(selected, true, DEMO_RUN_ID)
    } else {
      onRun(selected, false)
    }
  }

  const statusLabel =
    phase === "idle"       ? "Ready" :
    phase === "supervisor" ? "Briefing archetypes" :
    phase === "reacting"   ? "Reasoning in progress" :
    phase === "reporting"  ? "Generating brief" :
    phase === "done"       ? "Complete" : "Active"

  return (
    <header className="bg-white border-b border-ps sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="max-w-screen-xl mx-auto px-6 py-0">
        {/* Brand bar */}
        <div className="flex items-center justify-between h-12 border-b border-ps">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-600" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-700">
              Policy Simulation System
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={["text-xs font-medium", running ? "text-amber-700" : "text-slate-400"].join(" ")}>
              {statusLabel}
            </span>
            {running && (
              <span className="inline-flex gap-0.5 ml-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-amber-600"
                    style={{ animation: `blink 1.2s step-end ${i * 0.3}s infinite` }}
                  />
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 py-3">
          <span className="label-caps shrink-0">Scenario</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={running}
            className="flex-1 max-w-xs bg-white border border-ps-2 text-slate-700 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 disabled:opacity-40"
          >
            {scenarios.length > 0
              ? scenarios.map((s) => <option key={s.path} value={s.path}>{s.label}</option>)
              : <option value="knowledge_base/fiscal/uk_vat_2010.md">UK VAT Rise 2010 (17.5% → 20%)</option>
            }
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Live / Replay toggle */}
            <div className="flex items-center border border-ps-2 rounded-md overflow-hidden bg-white">
              {(["replay", "live"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={running}
                  className={[
                    "px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                    mode === m
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {m === "replay" ? "Replay" : "Live"}
                </button>
              ))}
            </div>

            {/* Run / Stop */}
            <button
              onClick={handleRun}
              className={[
                "px-4 py-1.5 text-xs font-semibold rounded-md border transition-all",
                running
                  ? "border-slate-200 text-slate-500 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  : "border-amber-600 bg-amber-600 text-white hover:bg-amber-700",
              ].join(" ")}
            >
              {running ? "Stop" : "Run"}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
