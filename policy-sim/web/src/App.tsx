import { useRunStream } from "@/hooks/useRunStream"
import { PolicyInput } from "@/components/PolicyInput"
import { SupervisorBriefing } from "@/components/SupervisorBriefing"
import { ArchetypeCard } from "@/components/ArchetypeCard"
import { BriefDisplay } from "@/components/BriefDisplay"
import { ValidationPanel } from "@/components/ValidationPanel"
import type { ArchetypeState } from "@/hooks/useRunStream"

const ARCHETYPE_ORDER = [
  "low_income_worker",
  "small_business_owner",
  "urban_professional",
  "retired_pensioner",
]

const ARCHETYPE_NAMES: Record<string, string> = {
  low_income_worker:    "Sarah",
  small_business_owner: "Mark",
  urban_professional:   "Priya",
  retired_pensioner:    "Arthur",
}

function KPICard({ archetypeId, state }: { archetypeId: string; state: ArchetypeState | undefined }) {
  const name = ARCHETYPE_NAMES[archetypeId] ?? archetypeId
  const stance = state?.reaction?.support_or_oppose ?? null
  const isSupport = stance !== null && stance > 0.1
  const isOppose  = stance !== null && stance < -0.1
  const color     = isSupport ? "#15803d" : isOppose ? "#b91c1c" : "#64748b"
  const bg        = isSupport ? "#f0fdf4" : isOppose ? "#fef2f2" : "#f8fafc"
  const border    = isSupport ? "#bbf7d0" : isOppose ? "#fecaca" : "#e2e8f0"
  const label     = isSupport ? "Support" : isOppose ? "Oppose" : stance !== null ? "Neutral" : "Pending"

  return (
    <div className="flex-1 rounded-lg p-4 border" style={{ background: bg, borderColor: border }}>
      <p className="text-xs font-medium text-slate-500 mb-1">{name}</p>
      <p className="text-xl font-semibold tabular-nums" style={{ color }}>
        {stance !== null ? (stance > 0 ? "+" : "") + stance.toFixed(2) : "—"}
      </p>
      <p className="text-xs mt-1 font-medium" style={{ color }}>{label}</p>
    </div>
  )
}

export default function App() {
  const { state, start, stop } = useRunStream()

  const displayIds = state.archetypeIds.length > 0 ? state.archetypeIds : ARCHETYPE_ORDER
  const showKPI = state.phase === "reacting" || state.phase === "reporting" || state.phase === "done"

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PolicyInput phase={state.phase} onRun={start} onStop={stop} />

      <SupervisorBriefing
        phase={state.phase}
        text={state.supervisorText}
        briefings={state.briefings}
      />

      {/* KPI row — appears once archetypes start reacting */}
      {showKPI && (
        <div className="max-w-screen-xl mx-auto w-full px-4 pt-4">
          <div className="flex gap-3">
            {displayIds.map((id) => (
              <KPICard key={id} archetypeId={id} state={state.archetypes[id]} />
            ))}
          </div>
        </div>
      )}

      {/* 2×2 archetype grid */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full p-4 grid grid-cols-2 gap-3" style={{ minHeight: "420px" }}>
        {displayIds.map((id) => (
          <ArchetypeCard
            key={id}
            archetypeId={id}
            archetypeState={state.archetypes[id]}
            briefing={state.briefings[id]}
          />
        ))}
      </main>

      <BriefDisplay
        phase={state.phase}
        markdown={state.briefMarkdown}
        archetypes={state.archetypes}
        briefAudioUrl={state.briefAudioUrl}
      />

      <ValidationPanel validation={state.validation} />
    </div>
  )
}
