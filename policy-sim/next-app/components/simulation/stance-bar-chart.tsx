"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface StanceScore {
  name: string
  displayName: string
  score: number // -100 to +100
}

interface StanceBarChartProps {
  scores: StanceScore[]
  title?: string
}

const chartConfig = {
  support: {
    label: "Support",
    color: "var(--chart-1)",
  },
  oppose: {
    label: "Oppose",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

function formatScore(score: number): string {
  const sign = score > 0 ? "+" : ""
  return `${sign}${score}`
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { displayName: string } }>
}) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const label = payload[0].payload.displayName
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-sm shadow-lg ring-1 ring-foreground/10">
      <span className="font-medium">{label}:</span>{" "}
      <span className={score >= 0 ? "text-[var(--chart-1)]" : "text-[var(--destructive)]"}>
        {formatScore(score)}
      </span>
    </div>
  )
}

export function StanceBarChart({ scores, title = "Stance Scores" }: StanceBarChartProps) {
  const data = scores.map((s) => ({
    name: s.displayName,
    displayName: s.displayName,
    score: s.score,
    fill: s.score >= 0 ? "var(--chart-1)" : "var(--destructive)",
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <ResponsiveContainer>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
              />
              <XAxis
                type="number"
                domain={[-100, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatScore(v)}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <ChartTooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
