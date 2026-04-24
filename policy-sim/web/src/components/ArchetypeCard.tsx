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

const ARCHETYPE_ACCENT: Record<string, string> = {
  low_income_worker:    "#f59e0b",
  small_business_owner: "#3b82f6",
  urban_professional:   "#10b981",
  retired_pensioner:    "#8b5cf6",
}

const ARCHETYPE_BG: Record<string, { light: string; dark: string }> = {
  low_income_worker:    { light: "#fef9ee", dark: "#1c1506" },
  small_business_owner: { light: "#eff6ff", dark: "#04101f" },
  urban_professional:   { light: "#f0fdf9", dark: "#021a10" },
  retired_pensioner:    { light: "#f5f3ff", dark: "#100820" },
}

interface Props {
  archetypeId: string
  archetypeState: ArchetypeState | undefined
  briefing: Briefing | undefined
}

function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
      <span className="block mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Voice</span>
      <audio controls src={url} className="w-full h-8" style={{ colorScheme: "light" }} />
    </div>
  )
}

function PortraitAvatar({ archetypeId, name }: { archetypeId: string; name: string }) {
  const [hasImage, setHasImage] = useState(true)
  const accent = ARCHETYPE_ACCENT[archetypeId] ?? "#94a3b8"
  const bg = ARCHETYPE_BG[archetypeId] ?? { light: "#f1f5f9", dark: "#1e293b" }

  return (
    <div
      className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden flex items-end justify-center"
      style={{ background: bg.light }}
    >
      {hasImage ? (
        <img
          src={`/portraits/${name.toLowerCase()}.png`}
          alt={name}
          className="w-full h-full object-contain object-bottom"
          onError={() => setHasImage(false)}
        />
      ) : (
        <span className="text-xl font-bold mb-2" style={{ color: accent }}>{name.charAt(0)}</span>
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
      <div className="relative h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="absolute -top-1 h-3 w-1.5 rounded-sm transition-all duration-700"
          style={{ left: `calc(${pct}% - 3px)`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  )
}

function ReactionDisplay({ reaction }: { reaction: Reaction }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div>
        <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Immediate impact</span>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{reaction.immediate_impact}</p>
      </div>
      <div>
        <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Household response</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{reaction.household_response}</p>
      </div>
      {reaction.concerns.length > 0 && (
        <div>
          <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Key concerns</span>
          <ul className="space-y-0.5">
            {reaction.concerns.map((c, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex gap-1.5">
                <span className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0">›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <span className="block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Verdict</span>
        <StanceBar value={reaction.support_or_oppose} />
      </div>
    </div>
  )
}

function ThinkingStream({
  archetypeState,
  thinkingRef,
  isThinking,
}: {
  archetypeState: ArchetypeState
  thinkingRef: React.RefObject<HTMLDivElement>
  isThinking: boolean
}) {
  const streamText = archetypeState.thinking || archetypeState.reactionTokens
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg, #0d1117 0%, #131a24 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Window chrome */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="text-[0.58rem] font-semibold uppercase tracking-widest" style={{ color: "#4b6378" }}>
          reasoning
        </span>
        {isThinking ? (
          <div className="flex gap-1 items-center">
            {[0, 120, 240].map(d => (
              <span
                key={d}
                className="w-1 h-1 rounded-full animate-bounce"
                style={{ background: "#34d399", animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Stream content with fade */}
      <div className="relative">
        <div
          ref={thinkingRef}
          className="thinking-stream px-3.5 py-3 overflow-y-auto"
          style={{ maxHeight: "190px" }}
        >
          {streamText ? (
            <>
              {streamText}
              {isThinking && <span className="cursor-blink" />}
            </>
          ) : (
            <span style={{ color: "#4b6378" }}>Initialising<span className="cursor-blink" /></span>
          )}
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #131a24)" }}
        />
      </div>
    </div>
  )
}

export function ArchetypeCard({ archetypeId, archetypeState, briefing }: Props) {
  const meta     = PERSONA_META[archetypeId] ?? { name: archetypeId, age: 0, region: "UK", role: "", ref: "PS-???" }
  const accent   = ARCHETYPE_ACCENT[archetypeId] ?? "#94a3b8"
  const thinkingRef = useRef<HTMLDivElement>(null)
  const isThinking  = !!(archetypeState && archetypeState.thinking.length > 0 && !archetypeState.complete)
  const hasReaction = archetypeState?.reaction != null

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight
    }
  }, [archetypeState?.thinking])

  const stanceValue      = archetypeState?.reaction?.support_or_oppose ?? null
  const isSupport        = stanceValue !== null && stanceValue > 0.1
  const isOppose         = stanceValue !== null && stanceValue < -0.1
  const leftBorderColor  = stanceValue === null ? accent + "40" : isSupport ? "#16a34a" : isOppose ? "#dc2626" : "#94a3b8"

  return (
    <Card
      className="overflow-hidden flex flex-col"
      style={{ borderLeftWidth: "3px", borderLeftColor: leftBorderColor, transition: "border-left-color 0.6s ease" }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-3">
          <PortraitAvatar archetypeId={archetypeId} name={meta.name} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{meta.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{meta.age}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{meta.role}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600">{meta.region}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[0.6rem] font-mono text-gray-300 dark:text-gray-700">{meta.ref}</span>
          {archetypeState?.complete && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">Done</span>
          )}
          {isThinking && (
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400 animate-pulse">Thinking</span>
          )}
        </div>
      </div>

      {/* Briefing */}
      {briefing && (
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex gap-2.5">
            <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: accent, opacity: 0.7 }} />
            <div>
              <span className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: accent }}>Briefing</span>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{briefing.headline}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 py-3 overflow-hidden">
        {!archetypeState ? (
          <p className="text-xs text-gray-300 dark:text-gray-700 italic">Awaiting briefing</p>
        ) : hasReaction ? (
          <>
            <ReactionDisplay reaction={archetypeState.reaction!} />
            {archetypeState.audioUrl && <AudioPlayer url={archetypeState.audioUrl} />}
          </>
        ) : (
          <ThinkingStream
            archetypeState={archetypeState}
            thinkingRef={thinkingRef}
            isThinking={isThinking}
          />
        )}
      </div>
    </Card>
  )
}
