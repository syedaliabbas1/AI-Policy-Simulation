// DashboardPage — IFS validation overview for policy minister [v0.0.1]

"use client"
import { MetricCard } from "@/components/MetricCard"
import { CategoryBar } from "@/components/ui/CategoryBar"
import { ProgressCircle } from "@/components/ui/ProgressCircle"
import { BarList } from "@/components/ui/BarList"
import { Badge } from "@/components/tremor/Badge"
import { useRunStream } from "@/hooks/useRunStream"

const ARCHETYPE_NAMES: Record<string, string> = {
  low_income_worker:    "Sarah",
  small_business_owner: "Mark",
  urban_professional:   "Priya",
  retired_pensioner:    "Arthur",
}

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  low_income_worker:    "Low-income worker, Urban, Age 28",
  small_business_owner: "Small business, Rural, Age 44",
  urban_professional:   "Highly paid, Urban, Age 35",
  retired_pensioner:    "Pensioner, Suburban, Age 71",
}

// Sample data for demonstration when no simulation has run
const DEMO_ARCHETYPE_SCORES = [
  { id: "low_income_worker",    score: 0.72, netCost: 2400, impact: 0.85 },
  { id: "small_business_owner", score: -0.31, netCost: -1800, impact: 0.62 },
  { id: "urban_professional",   score: 0.45, netCost: 3200, impact: 0.74 },
  { id: "retired_pensioner",    score: 0.88, netCost: 4100, impact: 0.91 },
]

const DEMO_TOP_AREAS = [
  { name: "Income Tax", value: 3400 },
  { name: "National Insurance", value: 2100 },
  { name: "VAT", value: 1800 },
  { name: "Corporation Tax", value: 1200 },
  { name: "Council Tax", value: 600 },
]

const DEMO_RECENT_RUNS = [
  { runId: "gentle-sparrow-8096", policy: "UK VAT 2010", date: "2026-04-23", score: 0.68 },
  { runId: "swift-robin-1234", policy: "Carbon Floor Price", date: "2026-04-22", score: 0.54 },
  { runId: "amber-eagle-5678", policy: "Income Tax Relief", date: "2026-04-21", score: 0.81 },
  { runId: "copper-fox-9012", policy: "Business Rate Reform", date: "2026-04-20", score: 0.39 },
]

function ArchetypeRow({ id, score, netCost, impact }: { id: string; score: number; netCost: number; impact: number }) {
  const name = ARCHETYPE_NAMES[id] ?? id
  const description = ARCHETYPE_DESCRIPTIONS[id] ?? ""

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{name[0]}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={score >= 0 ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400" : "text-sm font-semibold text-red-600 dark:text-red-400"}>
            {score >= 0 ? "+" : ""}{score.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">stance</p>
        </div>
        <div className="w-32 hidden sm:block">
          <CategoryBar
            values={[Math.abs(netCost) / 50]}
            colors={["blue"]}
            showLabels={false}
          />
        </div>
        <ProgressCircle value={impact * 100} max={100} radius={20} strokeWidth={3}>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{(impact * 100).toFixed(0)}</span>
        </ProgressCircle>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { state } = useRunStream()
  const hasData = state.phase === "done" || state.phase === "reporting" || state.phase === "reacting"

  const avgScore = DEMO_ARCHETYPE_SCORES.reduce((s, a) => s + a.score, 0) / DEMO_ARCHETYPE_SCORES.length
  const confidence = 78
  const budgetAlignment = 64
  const distributionalScore = 71

  return (
    <div className="max-w-screen-xl mx-auto w-full px-4 md:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Policy Impact Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          IFS-backed analysis across four population archetypes
        </p>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avg Stance Score"
          value={(avgScore >= 0 ? "+" : "") + avgScore.toFixed(2)}
          change={12.4}
          changeLabel="vs baseline"
          badgeVariant={avgScore >= 0 ? "success" : "error"}
        />
        <MetricCard
          label="IFS Confidence"
          value={`${confidence}%`}
          badgeVariant="success"
          visualization={
            <ProgressCircle value={confidence} max={100} radius={28} strokeWidth={4}>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{confidence}</span>
            </ProgressCircle>
          }
        />
        <MetricCard
          label="Budget Alignment"
          value={`${budgetAlignment}%`}
          badgeVariant="neutral"
          visualization={
            <CategoryBar
              values={[budgetAlignment, 100 - budgetAlignment]}
              colors={["blue", "gray"]}
              showLabels={false}
              marker={{ value: budgetAlignment, tooltip: "Current" }}
            />
          }
        />
        <MetricCard
          label="Distributional Score"
          value={`${distributionalScore}%`}
          change={-3.2}
          changeLabel="vs prior"
          badgeVariant="warning"
        />
      </div>

      {/* Archetype impacts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Archetype Impact Breakdown</h2>
          <Badge variant="neutral">4 archetypes</Badge>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-900 bg-white dark:bg-[#090E1A] px-4">
          {DEMO_ARCHETYPE_SCORES.map((a) => (
            <ArchetypeRow key={a.id} {...a} />
          ))}
        </div>
      </section>

      {/* Two-column: Top areas + Recent runs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top policy areas */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Top Policy Areas by Cost Impact</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-900 bg-white dark:bg-[#090E1A] p-4">
            <BarList
              data={DEMO_TOP_AREAS}
              valueFormatter={(v) => `£${v.toLocaleString()}`}
              sortOrder="descending"
            />
          </div>
        </section>

        {/* Recent runs */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Recent Simulations</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-900 bg-white dark:bg-[#090E1A] overflow-hidden">
            <table className="w-full border-b border-gray-200 dark:border-gray-800">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Run ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Policy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {DEMO_RECENT_RUNS.map((run) => (
                  <tr key={run.runId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{run.runId}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-50">{run.policy}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{run.date}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={run.score >= 0.6 ? "text-emerald-600 dark:text-emerald-400 text-xs font-semibold" : run.score >= 0.4 ? "text-yellow-600 dark:text-yellow-400 text-xs font-semibold" : "text-red-600 dark:text-red-400 text-xs font-semibold"}>
                        {run.score >= 0.6 ? "High" : run.score >= 0.4 ? "Med" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Active simulation notice */}
      {hasData && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 px-4 py-3">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Live simulation in progress — results update in real time. Phase: <span className="font-semibold capitalize">{state.phase}</span>
          </p>
        </div>
      )}
    </div>
  )
}