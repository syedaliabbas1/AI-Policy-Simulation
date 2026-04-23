import { useEffect, useRef, useState } from "react"
import type { Briefing, Reaction } from "@/lib/events"
import type { ArchetypeState } from "@/hooks/useRunStream"

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
    <div className="mt-3 pt-3 border-t border-ps">
      <span className="label-caps block mb-1.5">Voice</span>
      <audio
        controls
        src={url}
        className="w-full h-8"
        style={{ colorScheme: "light" }}
      />
    </div>
  )
}

function PortraitAvatar({ archetypeId, name }: { archetypeId: string; name: string }) {
  const [hasImage, setHasImage] = useState(true)
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden border border-ps-2 shrink-0 bg-slate-100 flex items-center justify-center">
      {hasImage ? (
        <img
          src={`/portraits/${archetypeId}.png`}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasImage(false)}
        />
      ) : (
        <span className="text-xs font-semibold text-slate-500">{name.charAt(0)}</span>
      )}
    </div>
  )
}

function StanceBar({ value }: { value: number }) {
  const pct = ((value + 1) / 2) * 100
  const isSupport = value > 0.1
  const isOppose = value < -0.1
  const color = isSupport ? "var(--ps-support)" : isOppose ? "var(--ps-oppose)" : "var(--ps-text-muted)"

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="label-caps text-red-500">Oppose</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>
          {value > 0 ? "+" : ""}{value.toFixed(2)}
        </span>
        <span className="label-caps text-green-600">Support</span>
      </div>
      <div className="stance-track">
        <div
          className="absolute -top-1.5 w-3 h-6 rounded-sm transition-all duration-700 ease-out"
          style={{
            left: `calc(${pct}% - 6px)`,
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
        <span className="label-caps block mb-1">Immediate impact</span>
        <p className="text-xs text-slate-700 leading-relaxed">{reaction.immediate_impact}</p>
      </div>
      <div>
        <span className="label-caps block mb-1">Household response</span>
        <p className="text-xs text-slate-500 leading-relaxed">{reaction.household_response}</p>
      </div>
      {reaction.concerns.length > 0 && (
        <div>
          <span className="label-caps block mb-1">Key concerns</span>
          <ul className="space-y-0.5">
            {reaction.concerns.map((c, i) => (
              <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                <span className="text-amber-600 mt-0.5 shrink-0">›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="pt-2 border-t border-ps">
        <span className="label-caps block mb-2">Verdict</span>
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
  const isSupport = stanceValue !== null && stanceValue > 0.1
  const isOppose  = stanceValue !== null && stanceValue < -0.1

  const leftBorderColor =
    stanceValue === null ? "#e2e8f0"
    : isSupport          ? "var(--ps-support)"
    : isOppose           ? "var(--ps-oppose)"
    : "#94a3b8"

  return (
    <div
      className="flex flex-col bg-white rounded-lg overflow-hidden card-glow"
      style={{
        borderLeft: `3px solid ${leftBorderColor}`,
        border: "1px solid var(--ps-border)",
        borderLeftWidth: "3px",
        borderLeftColor: leftBorderColor,
        transition: "border-left-color 0.6s ease",
        boxShadow: "var(--ps-shadow)",
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-ps bg-slate-50">
        <div className="flex items-center gap-3">
          <PortraitAvatar archetypeId={archetypeId} name={meta.name} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-slate-900">{meta.name}</span>
              <span className="text-xs text-slate-400">{meta.age}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="label-caps">{meta.region}</span>
              <span className="text-slate-300">·</span>
              <span className="label-caps">{meta.role}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="label-caps text-slate-300">{meta.ref}</span>
          {archetypeState?.complete && (
            <span className="text-xs font-medium text-green-600">Complete</span>
          )}
          {isThinking && (
            <span className="text-xs font-medium text-emerald-600 animate-pulse">Reasoning</span>
          )}
        </div>
      </div>

      {/* Briefing headline */}
      {briefing && (
        <div className="px-4 py-2 border-b border-ps bg-amber-50">
          <span className="label-caps-gold block mb-0.5">Briefing</span>
          <p className="text-xs text-slate-700 leading-snug">{briefing.headline}</p>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 px-4 py-3 overflow-hidden">
        {!archetypeState ? (
          <p className="text-xs text-slate-400 italic">Awaiting briefing…</p>
        ) : hasReaction ? (
          <>
            <ReactionDisplay reaction={archetypeState.reaction!} />
            {archetypeState.audioUrl && <AudioPlayer url={archetypeState.audioUrl} />}
          </>
        ) : (
          /* Thinking phase — deliberate dark terminal block */
          <div className="relative">
            <div className="rounded-md px-3 py-2 mb-2" style={{ background: "var(--ps-terminal-bg)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-widest uppercase text-emerald-500" style={{ fontSize: "0.6rem" }}>
                  Extended Thinking
                </span>
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
                <p className="text-slate-400 font-mono" style={{ fontSize: "0.65rem", lineHeight: 1.5 }}>
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
