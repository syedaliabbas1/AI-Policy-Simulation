import ReactMarkdown from "react-markdown"
import type { Phase } from "@/hooks/useRunStream"
import type { Reaction } from "@/lib/events"

interface Props {
  phase: Phase
  markdown: string
  archetypes: Record<string, { reaction: Reaction | null; complete: boolean }>
}

function StanceSummary({ archetypes }: { archetypes: Props["archetypes"] }) {
  const names: Record<string, string> = {
    low_income_worker: "Sarah",
    small_business_owner: "David",
    urban_professional: "James",
    retired_pensioner: "Margaret",
  }

  const entries = Object.entries(archetypes)
    .filter(([, s]) => s.reaction !== null)
    .map(([id, s]) => ({ id, name: names[id] ?? id, value: s.reaction!.support_or_oppose }))
    .sort((a, b) => a.value - b.value)

  if (entries.length === 0) return null

  return (
    <div className="mb-6 p-4 border border-ps rounded bg-ps-surface-2">
      <span className="label-caps-gold block mb-3">Distributional Stance</span>
      <div className="space-y-2">
        {entries.map(({ id, name, value }) => {
          const pct = ((value + 1) / 2) * 100
          const isSupport = value > 0.1
          const isOppose = value < -0.1
          const color = isSupport ? "var(--ps-support)" : isOppose ? "var(--ps-oppose)" : "var(--ps-text-muted)"
          return (
            <div key={id} className="flex items-center gap-3">
              <span className="text-xs text-ps-muted w-16 shrink-0">{name}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--ps-border-2)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="text-xs tabular-nums w-10 text-right" style={{ color }}>
                {value > 0 ? "+" : ""}{value.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BriefDisplay({ phase, markdown, archetypes }: Props) {
  if (phase === "idle") return null

  const isStreaming = phase === "reporting"

  return (
    <section className="border-t border-ps" style={{ background: "var(--ps-bg)" }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-0.5 h-8 rounded-full bg-ps-gold" />
          <div>
            <h2 className="text-sm font-semibold text-ps-heading tracking-tight">Policy Analysis Brief</h2>
            <span className="label-caps">
              {isStreaming ? "Generating…" : "Completed"}
            </span>
          </div>
          {isStreaming && <span className="cursor-blink text-ps-gold ml-2" />}
        </div>

        {/* Stance summary chart */}
        <StanceSummary archetypes={archetypes} />

        {/* Markdown brief */}
        {markdown && (
          <div
            className="prose-brief"
            style={{
              fontFamily: "var(--font-document)",
              fontSize: "0.975rem",
              lineHeight: "1.7",
              color: "var(--ps-text)",
            }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{ fontFamily: "var(--font-document)", fontSize: "1.4rem", fontWeight: 500, color: "var(--ps-heading)", marginBottom: "0.5rem", borderBottom: "1px solid var(--ps-border)", paddingBottom: "0.5rem" }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontFamily: "var(--font-document)", fontSize: "1.05rem", fontWeight: 600, color: "var(--ps-heading)", marginTop: "1.5rem", marginBottom: "0.4rem", letterSpacing: "0.02em" }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ps-gold)", marginTop: "1.2rem", marginBottom: "0.3rem" }}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p style={{ marginBottom: "0.85rem", color: "var(--ps-text)" }}>{children}</p>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: "0.3rem", color: "var(--ps-text)" }}>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong style={{ color: "var(--ps-heading)", fontWeight: 600 }}>{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: "3px solid var(--ps-gold)", paddingLeft: "1rem", margin: "1rem 0", color: "var(--ps-text-muted)", fontStyle: "italic" }}>
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
