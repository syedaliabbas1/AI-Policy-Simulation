import ReactMarkdown from "react-markdown"
import { BarList } from "@tremor/react"
import type { Phase } from "@/hooks/useRunStream"
import type { Reaction } from "@/lib/events"
import { Card } from "./tremor/Card"

interface Props {
  phase: Phase
  markdown: string
  archetypes: Record<string, { reaction: Reaction | null; complete: boolean }>
  briefAudioUrl: string | null
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

  return (
    <Card className="mb-6 p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-4">
        Distributional Stance
      </p>
      <BarList
        data={data}
        valueFormatter={(v: number) => v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
        color="blue"
        className="max-h-48"
      />
      <div className="flex justify-between mt-3 px-1">
        <span className="text-xs font-medium text-red-500">Oppose</span>
        <span className="text-xs text-gray-400">Neutral</span>
        <span className="text-xs font-medium text-emerald-500">Support</span>
      </div>
    </Card>
  )
}

export function BriefDisplay({ phase, markdown, archetypes, briefAudioUrl }: Props) {
  if (phase === "idle") return null
  const isStreaming = phase === "reporting"

  return (
    <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#090E1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Policy Analysis Brief</h2>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {isStreaming ? "Generating…" : "Completed"}
            </span>
          </div>
          {isStreaming && <span className="cursor-blink text-blue-500 ml-1">▋</span>}
          {briefAudioUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Narration</span>
              <audio controls src={briefAudioUrl} className="h-8" style={{ width: "200px", colorScheme: "light" }} />
            </div>
          )}
        </div>

        <StanceChart archetypes={archetypes} />

        {markdown && (
          <div className="font-sans text-gray-900 dark:text-gray-50">
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
            {isStreaming && <span className="cursor-blink text-blue-500">▋</span>}
          </div>
        )}
      </div>
    </section>
  )
}
