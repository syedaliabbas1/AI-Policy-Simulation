"use client"
import { useState, useCallback, useRef } from "react"
import { Card } from "@/components/tremor/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tremor/Tabs"
import { StanceChart } from "@/components/StanceChart"
import { compareRuns, compareBriefs, listPolicies, type Policy } from "@/lib/api"
import { streamRun } from "@/lib/sseClient"
import { createRun } from "@/lib/api"
import ReactMarkdown from "react-markdown"

const ARCHETYPE_NAMES: Record<string, string> = {
  low_income_worker:    "Sarah",
  small_business_owner: "Mark",
  urban_professional:   "Priya",
  retired_pensioner:    "Arthur",
}

interface CompareColumn {
  runId: string
  policyLabel: string
  scores: Record<string, { score: number; name: string }>
  markdown: string
}

interface LiveRun {
  runId: string
  policyLabel: string
  phase: "supervisor" | "reacting" | "reporting" | "done"
  scores: Record<string, { score: number; name: string }>
  briefings: Record<string, unknown>
  archetypes: Record<string, { reaction: { support_or_oppose: number } | null }>
  markdown: string
}

// ── Compare tab ────────────────────────────────────────────────
function CompareTab() {
  const [runIds, setRunIds] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<CompareColumn[]>([])

  async function handleCompare() {
    const ids = runIds.split(",").map((s) => s.trim()).filter(Boolean)
    if (ids.length < 2) { setError("Enter at least 2 run IDs, comma-separated"); return }
    setLoading(true)
    setError(null)
    try {
      const [runsRes, briefsRes] = await Promise.all([compareRuns(ids), compareBriefs(ids)])
      const cols: CompareColumn[] = runsRes.runs.map((r) => {
        const brief = briefsRes.briefs.find((b) => b.run_id === r.run_id)
        return {
          runId: r.run_id,
          policyLabel: r.policy_label,
          scores: r.archetype_scores,
          markdown: brief?.markdown ?? "",
        }
      })
      setColumns(cols)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1.5">
              Run IDs
            </label>
            <input
              value={runIds}
              onChange={(e) => setRunIds(e.target.value)}
              placeholder="gentle-sparrow-8096, swift-robin-1234"
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleCompare}
            disabled={loading}
            className="mt-5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40"
          >
            {loading ? "Loading…" : "Compare"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </Card>

      {columns.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col) => (
            <ColumnCard key={col.runId} column={col} />
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnCard({ column }: { column: CompareColumn }) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-500 truncate">{column.runId}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5">{column.policyLabel}</p>
      </div>
      <StanceChart scores={column.scores} />
      {column.markdown && (
        <div className="prose prose-sm dark:prose-invert max-h-64 overflow-y-auto text-gray-700 dark:text-gray-300">
          <ReactMarkdown>{String(column.markdown.slice(0, 800) + (column.markdown.length > 800 ? "…" : ""))}</ReactMarkdown>
        </div>
      )}
    </Card>
  )
}

// ── Simulate tab ────────────────────────────────────────────────
function SimulateTab() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [liveRuns, setLiveRuns] = useState<LiveRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<Record<string, AbortController>>({})

  // Load policy list on mount
  useState(() => {
    listPolicies().then(setPolicies).catch(() => {})
  })

  function togglePolicy(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleRunAll = useCallback(async () => {
    if (selected.length === 0) { setError("Select at least one policy"); return }
    setLoading(true)
    setError(null)

    const newRuns: LiveRun[] = selected.map((id) => {
      const policy = policies.find((p) => p.id === id)!
      return {
        runId: "",
        policyLabel: policy.label,
        phase: "supervisor",
        scores: {},
        briefings: {},
        archetypes: {},
        markdown: "",
      }
    })
    setLiveRuns(newRuns)

    // Kick off each run in parallel
    for (let i = 0; i < selected.length; i++) {
      const policy = policies.find((p) => p.id === selected[i])!
      try {
        const { run_id } = await createRun(policy.scenario_path)
        setLiveRuns((prev) => prev.map((r, j) => j === i ? { ...r, runId: run_id } : r))

        const abort = new AbortController()
        abortRef.current[run_id] = abort

        for await (const event of streamRun(run_id, false, 30, abort.signal)) {
          if (abort.signal.aborted) break

          setLiveRuns((prev) => prev.map((r, j) => {
            if (j !== i) return r
            switch (event.type) {
              case "run_started":
                return { ...r, phase: "supervisor", archetypes: {} }
              case "supervisor_done":
                return { ...r, briefings: event.briefings, phase: "reacting" }
              case "reaction_complete":
                return {
                  ...r,
                  phase: "reacting",
                  scores: {
                    ...r.scores,
                    [event.archetype_id]: {
                      score: event.reaction.support_or_oppose,
                      name: ARCHETYPE_NAMES[event.archetype_id] ?? event.archetype_id,
                    },
                  },
                  archetypes: {
                    ...r.archetypes,
                    [event.archetype_id]: { reaction: event.reaction },
                  },
                }
              case "brief_text":
                return { ...r, phase: "reporting", markdown: r.markdown + event.token }
              case "brief_done":
                return { ...r, phase: "done", markdown: event.markdown }
              default:
                return r
            }
          }))
        }
      } catch (e) {
        setLiveRuns((prev) => prev.map((r, j) => j === i ? { ...r, phase: "done" } : r))
      }
    }

    setLoading(false)
  }, [selected, policies])

  function handleStopAll() {
    Object.values(abortRef.current).forEach((a) => a.abort())
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePolicy(p.id)}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                selected.includes(p.id)
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={loading ? handleStopAll : handleRunAll}
            disabled={!loading && selected.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40"
          >
            {loading ? "Stop All" : "Run All"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </Card>

      {liveRuns.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${liveRuns.length}, minmax(0, 1fr))` }}>
          {liveRuns.map((run) => (
            <Card key={run.runId || run.policyLabel} className="p-4 space-y-4">
              <div>
                {run.runId && <p className="text-xs font-medium text-gray-500 dark:text-gray-500 truncate">{run.runId}</p>}
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5">{run.policyLabel}</p>
                <p className="text-xs text-gray-400 capitalize">{run.phase === "done" ? "Complete" : run.phase}</p>
              </div>
              <StanceChart scores={run.scores} />
              {run.markdown && (
                <div className="prose prose-sm dark:prose-invert max-h-48 overflow-y-auto text-gray-700 dark:text-gray-300">
                  <ReactMarkdown>{String(run.markdown.slice(0, 600) + (run.markdown.length > 600 ? "…" : ""))}</ReactMarkdown>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ComparePage ────────────────────────────────────────────
export function ComparePage() {
  const [activeTab, setActiveTab] = useState("compare")

  return (
    <div className="max-w-screen-xl mx-auto w-full px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Policy Comparison</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          {activeTab === "compare"
            ? "Enter run IDs from past simulations to compare stances and briefs side-by-side."
            : "Select one or more policies to run new live simulations and compare results as they complete."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="compare">Compare Runs</TabsTrigger>
          <TabsTrigger value="simulate">Simulate New</TabsTrigger>
        </TabsList>
        <TabsContent value="compare"><CompareTab /></TabsContent>
        <TabsContent value="simulate"><SimulateTab /></TabsContent>
      </Tabs>
    </div>
  )
}
