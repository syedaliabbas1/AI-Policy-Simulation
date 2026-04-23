import { useEffect, useRef } from "react"
import type { Briefing, Reaction } from "@/lib/events"
import type { ArchetypeState } from "@/hooks/useRunStream"

// Static persona metadata — matches data/archetypes/*.json
const PERSONA_META: Record<string, { name: string; age: number; region: string; role: string; ref: string }> = {
  low_income_worker:    { name: "Sarah",    age: 34, region: "North East",    role: "Part-time carer",       ref: "PS-001" },
  small_business_owner: { name: "David",    age: 48, region: "West Midlands", role: "Self-employed trader",  ref: "PS-002" },
  urban_professional:   { name: "James",    age: 32, region: "London",        role: "Urban professional",    ref: "PS-003" },
  retired_pensioner:    { name: "Margaret", age: 72, region: "South West",    role: "State pension reliant", ref: "PS-004" },
}

interface Props {
  archetypeId: string
  archetypeState: ArchetypeState | undefined
  briefing: Briefing | undefined
}

function StanceBar({ value }: { value: number }) {
  const pct = ((value + 1) / 2) * 100
  const isSupport = value > 0.1
  const isOppose = value < -0.1

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="label-caps text-oppose">Oppose</span>
        <span
          className={["text-xs font-semibold tabular-nums", isSupport ? "text-support" : isOppose ? "text-oppose" : "text-ps-muted"].join(" ")}
        >
          {value > 0 ? "+" : ""}{value.toFixed(2)}
        </span>
        <span className="label-caps text-support">Support</span>
      </div>
      <div className="stance-track">
        <div
          className="absolute -top-1 w-2.5 h-5 rounded-sm transition-all duration-700 ease-out"
          style={{
            left: `calc(${pct}% - 5px)`,
            background: isSupport ? "var(--ps-support)" : isOppose ? "var(--ps-oppose)" : "var(--ps-text-muted)",
            boxShadow: isSupport
              ? "0 0 6px var(--ps-support)"
              : isOppose
              ? "0 0 6px var(--ps-oppose)"
              : "none",
          }}
        />
      </div>
    </div>
  )
}

function ReactionDisplay({ reaction }: { reaction: Reaction }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div>
        <span className="label-caps block mb-1">Immediate impact</span>
        <p className="text-xs text-ps-text leading-relaxed">{reaction.immediate_impact}</p>
      </div>
      <div>
        <span className="label-caps block mb-1">Household response</span>
        <p className="text-xs text-ps-muted leading-relaxed">{reaction.household_response}</p>
      </div>
      {reaction.concerns.length > 0 && (
        <div>
          <span className="label-caps block mb-1">Key concerns</span>
          <ul className="space-y-0.5">
            {reaction.concerns.map((c, i) => (
              <li key={i} className="text-xs text-ps-muted flex gap-1.5">
                <span className="text-ps-gold mt-0.5 shrink-0">›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="pt-1 border-t border-ps">
        <span className="label-caps block mb-1.5">Verdict</span>
        <StanceBar value={reaction.support_or_oppose} />
      </div>
    </div>
  )
}

export function ArchetypeCard({ archetypeId, archetypeState, briefing }: Props) {
  const meta = PERSONA_META[archetypeId] ?? { name: archetypeId, age: 0, region: "UK", role: "", ref: "PS-???" }
  const thinkingRef = useRef<HTMLDivElement>(null)
  const isThinking = archetypeState && archetypeState.thinking.length > 0 && !archetypeState.complete
  const hasReaction = archetypeState?.reaction != null

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight
    }
  }, [archetypeState?.thinking])

  const stanceValue = archetypeState?.reaction?.support_or_oppose ?? null

  const leftBorderColor =
    stanceValue === null ? "var(--ps-border)"
    : stanceValue > 0.1  ? "var(--ps-support)"
    : stanceValue < -0.1 ? "var(--ps-oppose)"
    : "var(--ps-text-muted)"

  return (
    <div
      className="flex flex-col bg-ps-surface border border-ps rounded overflow-hidden card-glow"
      style={{ borderLeft: `3px solid ${leftBorderColor}`, transition: "border-left-color 0.6s ease" }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-ps bg-ps-surface-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ps-heading tracking-tight">{meta.name}</span>
            <span className="text-xs text-ps-muted">{meta.age}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="label-caps">{meta.region}</span>
            <span className="text-ps-faint">·</span>
            <span className="label-caps">{meta.role}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="label-caps text-ps-faint">{meta.ref}</span>
          {archetypeState?.complete && (
            <span className="label-caps text-ps-support">Complete</span>
          )}
          {isThinking && (
            <span className="label-caps text-terminal animate-pulse">Reasoning</span>
          )}
        </div>
      </div>

      {/* Briefing headline */}
      {briefing && (
        <div className="px-4 py-2 border-b border-ps bg-gold-dim">
          <span className="label-caps-gold block mb-0.5">Briefing</span>
          <p className="text-xs text-ps-text leading-snug">{briefing.headline}</p>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 px-4 py-3 overflow-hidden relative">
        {!archetypeState ? (
          <p className="text-xs text-ps-faint italic">Awaiting briefing…</p>
        ) : hasReaction ? (
          <ReactionDisplay reaction={archetypeState.reaction!} />
        ) : (
          /* Thinking phase — terminal overlay */
          <div className="relative">
            <div className="bg-terminal-dim rounded px-3 py-2 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal animate-pulse" />
                <span className="label-caps text-terminal">Extended Thinking</span>
              </div>
              <div
                ref={thinkingRef}
                className="thinking-stream overflow-y-auto"
                style={{ maxHeight: "160px" }}
              >
                {archetypeState.thinking || "Initialising…"}
                {isThinking && <span className="cursor-blink" />}
              </div>
            </div>
            {archetypeState.reactionTokens && (
              <div className="mt-2">
                <span className="label-caps block mb-1">Forming reaction…</span>
                <p className="text-xs text-ps-muted font-mono-ps opacity-70" style={{ fontSize: "0.65rem" }}>
                  {archetypeState.reactionTokens.slice(-200)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
