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
      className="border-b border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500"
      style={{ maxHeight: collapsed ? "38px" : "140px", background: "var(--tremor-background-subtle, #f8fafc)", darkModeBackground: "#0f172a" }}
      data-dark-bg="true"
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Supervisor</span>
          <span className="text-xs text-gray-400 dark:text-gray-600">
            {briefingCount} archetype briefings generated
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">expand</span>
        </button>
      ) : (
        <div className="px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Supervisor Analysis</span>
            {streaming && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">Streaming</span>
            )}
            {briefingCount > 0 && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 ml-auto">
                {briefingCount}/4 briefings ready
              </span>
            )}
          </div>
          <div
            ref={textRef}
            className="overflow-y-auto leading-relaxed text-gray-600 dark:text-gray-400"
            style={{ maxHeight: "80px", fontFamily: "ui-monospace, monospace", fontSize: "0.68rem" }}
          >
            {text || <span className="text-gray-400 dark:text-gray-600 italic">Awaiting supervisor…</span>}
            {streaming && <span className="cursor-blink" />}
          </div>
        </div>
      )}
    </div>
  )
}