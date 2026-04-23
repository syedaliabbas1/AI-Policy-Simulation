import ReactMarkdown from "react-markdown"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Cell, Tooltip } from "recharts"
import type { Phase } from "@/hooks/useRunStream"
import type { Reaction } from "@/lib/events"

interface Props {
  phase: Phase
  markdown: string
  archetypes: Record<string, { reaction: Reaction | null; complete: boolean }>
}

const ARCHETYPE_NAMES: Record<string, string> = {
  low_income_worker:    "Sarah",
  small_business_owner: "Mark",
  urban_professional:   "Priya",
  retired_pensioner:    "Arthur",
}

function StanceChart({ archetypes }: { archetypes: Props["archetypes"] }) {
  const data = Object.entries(archetypes)
    .filter(([, s]) => s.reaction !== null)
    .map(([id, s]) => ({
      name: ARCHETYPE_NAMES[id] ?? id,
      value: s.reaction!.support_or_oppose,
    }))
    .sort((a, b) => a.value - b.value)

  if (data.length === 0) return null

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number } }[] }) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0].payload
    const label = value > 0.1 ? "Support" : value < -0.1 ? "Oppose" : "Neutral"
    const color = value > 0.1 ? "#15803d" : value < -0.1 ? "#b91c1c" : "#64748b"
    return (
      <div className="bg-white border border-ps rounded-md px-3 py-2 shadow-md text-xs">
        <p className="font-semibold text-slate-900">{name}</p>
        <p style={{ color }}>{label}: {value > 0 ? "+" : ""}{value.toFixed(2)}</p>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-slate-50 rounded-lg border border-ps p-4">
      <span className="label-caps-gold block mb-4">Distributional Stance</span>
      <ResponsiveContainer width="100%" height={data.length * 52 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[-1, 1]}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(v) => v > 0 ? `+${v}` : `${v}`}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={42}
            tick={{ fontSize: 12, fontWeight: 500, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0.1 ? "#16a34a" : entry.value < -0.1 ? "#dc2626" : "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-2 px-1">
        <span className="label-caps text-red-500">Oppose</span>
        <span className="label-caps text-slate-400">Neutral</span>
        <span className="label-caps text-green-600">Support</span>
      </div>
    </div>
  )
}

export function BriefDisplay({ phase, markdown, archetypes }: Props) {
  if (phase === "idle") return null
  const isStreaming = phase === "reporting"

  return (
    <section className="border-t border-ps bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-amber-600" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Policy Analysis Brief</h2>
            <span className="text-xs text-slate-400">{isStreaming ? "Generating…" : "Completed"}</span>
          </div>
          {isStreaming && <span className="cursor-blink text-amber-600 ml-1" />}
        </div>

        <StanceChart archetypes={archetypes} />

        {markdown && (
          <div style={{ fontFamily: "var(--font-document)", fontSize: "1rem", lineHeight: "1.75", color: "var(--ps-text)" }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{ fontFamily: "var(--font-document)", fontSize: "1.5rem", fontWeight: 500, color: "#0f172a", marginBottom: "0.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", marginTop: "1.5rem" }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontFamily: "var(--font-document)", fontSize: "1.15rem", fontWeight: 600, color: "#1e293b", marginTop: "1.5rem", marginBottom: "0.4rem" }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b45309", marginTop: "1.2rem", marginBottom: "0.3rem" }}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p style={{ marginBottom: "0.85rem", color: "#334155" }}>{children}</p>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: "0.3rem", color: "#334155" }}>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong style={{ color: "#0f172a", fontWeight: 600 }}>{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: "3px solid #b45309", paddingLeft: "1rem", margin: "1rem 0", color: "#64748b", fontStyle: "italic" }}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
            {isStreaming && <span className="cursor-blink" />}
          </div>
        )}
      </div>
    </section>
  )
}
