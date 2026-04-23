import { useEffect, useRef, useState } from "react"
import type { Briefing, Reaction } from "@/lib/events"
import type { ArchetypeState } from "@/hooks/useRunStream"
import { Card } from "./tremor/Card"

const PERSONA_META: Record<string, { name: string; age: number; region: string; role: string; ref: string }> = {
  low_income_worker:    { name: "Sarah",  age: 34, region: "Sunderland",       role: "Part-time carer",        ref: "PS-001" },
  small_business_owner: { name: "Mark",   age: 48, region: "South Yorkshire",  role: "Self-employed builder",  ref: "PS-002" },
  urban_professional:   { name: "Priya",  age: 31, region: "Islington",        role: "Financial analyst",      ref: "PS-003" },
  retired_pensioner:    { name: "Arthur", age: 72, region: "Stoke-on-Trent",   role: "Retired factory worker", ref: "PS-004" },
}

interface Props {
  archetypeId: string
  archetypeState: ArchetypeState | undefined
  briefing: Briefing | undefined
}

function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
      <span className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Voice</span>
      <audio controls src={url} className="w-full h-8" style={{ colorScheme: "light" }} />
    </div>
  )
}

function PortraitAvatar({ archetypeId, name }: { archetypeId: string; name: string }) {
  const [hasImage, setHasImage] = useState(true)
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      {hasImage ? (
        <img
          src={`/portraits/${archetypeId}.png`}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasImage(false)}
        />
      ) : (
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{name.charAt(0)}</span>
      )}
    </div>
  )
}

function StanceBar({ value }: { value: number }) {
  const pct = ((value + 1) / 2) * 100
  const isSupport = value > 0.1
  const isOppose  = value < -0.1
  const color = isSupport ? "#16a34a" : isOppose ? "#dc2626" : "#94a3b8"

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-500">Oppose</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Support</span>
      </div>
      {/* Stance track: gray → support/oppose */}
      <div className="relative h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="absolute -top-1 h-3 w-1.5 rounded-sm transition-all duration-700"
          style={{
            left: `calc(${pct}% - 3px)`,
            background: color,
            boxShadow: `0 0 4px ${color}40`,
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
        <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">Immediate impact</span>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{reaction.immediate_impact}</p>
      </div>
      <div>
        <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">Household response</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{reaction.household_response}</p>
      </div>
      {reaction.concerns.length > 0 && (
        <div>
          <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">Key concerns</span>
          <ul className="space-y-0.5">
            {reaction.concerns.map((c, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex gap-1.5">
                <span className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0">›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <span className="block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">Verdict</span>
        <StanceBar value={reaction.support_or_oppose} />
      </div>
    </div>
  )
}

export function ArchetypeCard({ archetypeId, archetypeState, briefing }: Props) {
  const meta = PERSONA_META[archetypeId] ?? { name: archetypeId, age: 0, region: "UK", role: "", ref: "PS-???" }
  const thinkingRef = useRef<HTMLDivElement>(null)
  const isThinking  = archetypeState && archetypeState.thinking.length > 0 && !archetypeState.complete
  const hasReaction = archetypeState?.reaction != null

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight
    }
  }, [archetypeState?.thinking])

  const stanceValue = archetypeState?.reaction?.support_or_oppose ?? null
  const isSupport = stanceValue !== null && stanceValue > 0.1
  const isOppose  = stanceValue !== null && stanceValue < -0.1

  const leftBorderColor = stanceValue === null ? "#e2e8f0" : isSupport ? "#16a34a" : isOppose ? "#dc2626" : "#94a3b8"

  return (
    <Card
      className="overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: leftBorderColor, transition: "border-left-color 0.6s ease" }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <PortraitAvatar archetypeId={archetypeId} name={meta.name} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{meta.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-500">{meta.age}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-500">{meta.region}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-500">{meta.role}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-600">{meta.ref}</span>
          {archetypeState?.complete && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">Complete</span>
          )}
          {isThinking && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500 animate-pulse">Reasoning</span>
          )}
        </div>
      </div>

      {/* Briefing headline */}
      {briefing && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/50">
          <span className="block mb-0.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Briefing</span>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{briefing.headline}</p>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 px-4 py-3 overflow-hidden">
        {!archetypeState ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 italic">Awaiting briefing…</p>
        ) : hasReaction ? (
          <>
            <ReactionDisplay reaction={archetypeState.reaction!} />
            {archetypeState.audioUrl && <AudioPlayer url={archetypeState.audioUrl} />}
          </>
        ) : (
          <div className="rounded-md px-3 py-2 bg-gray-900 dark:bg-gray-950">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500" style={{ fontSize: "0.6rem" }}>
                {archetypeState.thinking ? "Extended Thinking" : "Reasoning"}
              </span>
            </div>
            <div
              ref={thinkingRef}
              className="thinking-stream overflow-y-auto"
              style={{ maxHeight: "200px" }}
            >
              {archetypeState.thinking ? (
                <>
                  {archetypeState.thinking}
                  {isThinking && <span className="cursor-blink" />}
                </>
              ) : archetypeState.reactionTokens ? (
                <>
                  {archetypeState.reactionTokens}
                  <span className="cursor-blink" />
                </>
              ) : (
                <>Initialising…<span className="cursor-blink" /></>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
