import { useEffect, useRef, useState } from "react"
import type { Briefing } from "@/lib/events"
import type { Phase } from "@/hooks/useRunStream"

interface Props {
  phase: Phase
  text: string
  briefings: Record<string, Briefing>
}

export function SupervisorBriefing({ phase, text, briefings }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const briefingCount = Object.keys(briefings).length
  const streaming = phase === "supervisor"

  useEffect(() => {
    if (phase === "reacting" && briefingCount === 4) {
      const t = setTimeout(() => setCollapsed(true), 1800)
      return () => clearTimeout(t)
    }
  }, [phase, briefingCount])

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [text])

  if (phase === "idle") return null

  return (
    <div
      className="border-b border-ps overflow-hidden transition-all duration-500"
      style={{ maxHeight: collapsed ? "38px" : "140px", background: "#fffbeb" }}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-amber-50 transition-colors"
        >
          <span className="label-caps-gold">Supervisor</span>
          <span className="text-xs text-slate-500">
            {briefingCount} archetype briefings generated
          </span>
          <span className="ml-auto text-xs text-slate-400">expand ↓</span>
        </button>
      ) : (
        <div className="px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="label-caps-gold">Supervisor Analysis</span>
            {streaming && (
              <span className="text-xs text-amber-600 font-medium animate-pulse">Streaming</span>
            )}
            {briefingCount > 0 && (
              <span className="text-xs text-green-600 font-medium ml-auto">
                {briefingCount}/4 briefings ready
              </span>
            )}
          </div>
          <div
            ref={textRef}
            className="overflow-y-auto leading-relaxed text-slate-600"
            style={{ maxHeight: "80px", fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}
          >
            {text || <span className="text-slate-400 italic">Awaiting supervisor…</span>}
            {streaming && <span className="cursor-blink" />}
          </div>
        </div>
      )}
    </div>
  )
}
