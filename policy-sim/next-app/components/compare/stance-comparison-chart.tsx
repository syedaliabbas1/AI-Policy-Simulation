"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { CompareRun } from "@/lib/types"

interface StanceComparisonChartProps {
  runs: CompareRun[]
}

function formatScore(score: number): string {
  const sign = score > 0 ? "+" : ""
  return `${sign}${Math.round(score)}`
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Array<{ value: number; name: string; payload: Record<string, any> }>
}) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const archName = payload[0].payload.name as string
  const runLabel = payload[0].name
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-sm shadow-lg ring-1 ring-foreground/10">
      <span className="font-medium">{runLabel}</span>
      <br />
      <span className="text-muted-foreground">{archName}: </span>
      <span className={value >= 0 ? "text-[var(--chart-1)]" : "text-destructive"}>
        {formatScore(value)}
      </span>
    </div>
  )
}

export function StanceComparisonChart({ runs }: StanceComparisonChartProps) {
  // Get all archetype IDs from all runs
  const allArchetypes = Array.from(
    new Set(runs.flatMap((r) => Object.keys(r.archetype_scores)))
  )

  // Build chart data: each archetype is an X-axis category, each run is a group of bars
  const data = allArchetypes.map((archId) => {
    const entry: Record<string, string | number> = { name: archId }
    runs.forEach((run) => {
      const score = run.archetype_scores[archId]?.score
      if (score !== undefined) {
        entry[run.run_id] = Math.round(score * 100)
      }
    })
    return entry
  })

  const chartConfig: ChartConfig = Object.fromEntries(
    runs.map((run) => [
      run.run_id,
      {
        label: run.policy_label ?? run.run_id.slice(0, 8),
      },
    ])
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                domain={[-100, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatScore(v)}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={75}
              />
              <ChartTooltip content={<CustomTooltip />} cursor={false} />
              <Legend />
              {runs.map((run, i) => {
                const colors = [
                  "var(--primary)",
                  "var(--chart-1)",
                  "var(--chart-2)",
                  "var(--chart-3)",
                ]
                return (
                  <Bar
                    key={run.run_id}
                    dataKey={run.run_id}
                    name={run.policy_label ?? run.run_id.slice(0, 8)}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                    fill={colors[i % colors.length]}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
