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
    <Card className="mb-8 p-5">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
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
    <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
              Policy Analysis Brief
            </p>
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-blue-500" />
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {isStreaming ? "Generating" : "Complete"}
              </span>
              {isStreaming && <span className="cursor-blink text-blue-500" />}
            </div>
          </div>
          {briefAudioUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Narration</span>
              <audio controls src={briefAudioUrl} className="h-8" style={{ width: "180px", colorScheme: "light" }} />
            </div>
          )}
        </div>

        <StanceChart archetypes={archetypes} />

        {markdown && (
          <div className="brief-body text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mt-5 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>
                ),
                li: ({ children }) => (
                  <li className="mb-1.5 text-gray-600 dark:text-gray-400">{children}</li>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 ml-4 space-y-1 list-disc list-outside">{children}</ul>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-amber-500 pl-4 my-4 text-gray-500 dark:text-gray-500 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
            {isStreaming && <span className="cursor-blink text-blue-500" />}
          </div>
        )}
      </div>
    </section>
  )
}
