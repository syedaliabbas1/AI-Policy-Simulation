import { useEffect, useState } from "react"
import { listScenarios, type Scenario } from "@/lib/api"
import type { Phase } from "@/hooks/useRunStream"

interface Props {
  phase: Phase
  onRun: (scenarioPath: string, replay: boolean, replayRunId?: string) => void
  onStop: () => void
}

const DEMO_RUN_ID = import.meta.env.VITE_DEMO_RUN_ID ?? "gentle-sparrow-8096"

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
    <header className="bg-white dark:bg-[#090E1A] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="max-w-screen-xl mx-auto px-6 py-0">
        {/* Brand bar */}
        <div className="flex items-center justify-between h-12 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-700 dark:text-gray-300">
              Policy Simulation System
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={["text-xs font-medium", running ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-600"].join(" ")}>
              {statusLabel}
            </span>
            {running && (
              <span className="inline-flex gap-0.5 ml-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-500"
                    style={{ animation: `blink 1.2s step-end ${i * 0.3}s infinite` }}
                  />
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 shrink-0">Scenario</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={running}
            className="flex-1 max-w-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-40"
          >
            {scenarios.length > 0
              ? scenarios.map((s) => <option key={s.path} value={s.path}>{s.label}</option>)
              : <option value="knowledge_base/fiscal/uk_vat_2010.md">UK VAT Rise 2010 (17.5% → 20%)</option>
            }
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Live / Replay toggle */}
            <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-white dark:bg-gray-900">
              {(["replay", "live"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={running}
                  className={[
                    "px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                    mode === m
                      ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
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
                  ? "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400"
                  : "border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600",
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