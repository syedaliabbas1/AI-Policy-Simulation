import { useEffect, useState } from "react"
import { listScenarios, type Scenario } from "@/lib/api"
import type { Phase } from "@/hooks/useRunStream"

interface Props {
  phase: Phase
  onRun: (scenarioPath: string, replay: boolean, replayRunId?: string) => void
  onStop: () => void
}

const DEMO_RUN_ID = "gentle-otter-9967"

export function PolicyInput({ phase, onRun, onStop }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selected, setSelected] = useState("")
  const [mode, setMode] = useState<"live" | "replay">("replay")
  const running = phase !== "idle" && phase !== "done" && phase !== "error"

  useEffect(() => {
    listScenarios()
      .then((s) => {
        setScenarios(s)
        if (s.length > 0) setSelected(s[0].path)
      })
      .catch(() => {
        // API not reachable — set a placeholder for demo
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

  return (
    <header className="border-b border-ps sticky top-0 z-50" style={{ background: "var(--ps-bg)" }}>
      {/* System header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-ps">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-ps-gold" style={{ boxShadow: "0 0 6px var(--ps-gold)" }} />
          <span className="label-caps-gold tracking-widest">Policy Simulation System</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-caps">
            {phase === "idle" ? "READY" :
             phase === "supervisor" ? "BRIEFING ARCHETYPES" :
             phase === "reacting" ? "REASONING IN PROGRESS" :
             phase === "reporting" ? "GENERATING BRIEF" :
             phase === "done" ? "COMPLETE" :
             "ACTIVE"}
          </span>
          {running && (
            <span className="inline-flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-ps-gold"
                  style={{ animation: `blink 1.2s step-end ${i * 0.3}s infinite` }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-6 py-3">
        {/* Scenario picker */}
        <div className="flex-1 flex items-center gap-2">
          <span className="label-caps shrink-0">Scenario</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={running}
            className="flex-1 max-w-xs bg-ps-surface-2 border border-ps-2 text-ps-text text-xs rounded px-3 py-1.5 focus:outline-none focus:border-gold-dim disabled:opacity-40"
          >
            {scenarios.length > 0
              ? scenarios.map((s) => <option key={s.path} value={s.path}>{s.label}</option>)
              : <option value="knowledge_base/fiscal/uk_vat_2010.md">UK VAT Rise 2010 (17.5% → 20%)</option>
            }
          </select>
        </div>

        {/* Live / Replay toggle */}
        <div className="flex items-center border border-ps rounded overflow-hidden">
          {(["replay", "live"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={running}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                mode === m
                  ? "bg-gold-dim text-ps-gold"
                  : "text-ps-muted hover:text-ps-text hover:bg-ps-surface-2",
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
            "px-4 py-1.5 text-xs font-semibold rounded border transition-all",
            running
              ? "border-ps-2 text-ps-muted bg-ps-surface-2 hover:text-ps-oppose hover:border-ps-oppose"
              : "border-gold-dim bg-gold-dim text-ps-gold hover:bg-ps-gold hover:text-black",
          ].join(" ")}
        >
          {running ? "Stop" : "Run"}
        </button>
      </div>
    </header>
  )
}
