import { useRunStream } from "@/hooks/useRunStream"
import { PolicyInput } from "@/components/PolicyInput"
import { SupervisorBriefing } from "@/components/SupervisorBriefing"
import { ArchetypeCard } from "@/components/ArchetypeCard"
import { BriefDisplay } from "@/components/BriefDisplay"
import { ValidationPanel } from "@/components/ValidationPanel"

const ARCHETYPE_ORDER = [
  "low_income_worker",
  "small_business_owner",
  "urban_professional",
  "retired_pensioner",
]

export default function App() {
  const { state, start, stop } = useRunStream()

  const displayIds = state.archetypeIds.length > 0
    ? state.archetypeIds
    : ARCHETYPE_ORDER

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ps-bg)" }}>
      <PolicyInput phase={state.phase} onRun={start} onStop={stop} />

      <SupervisorBriefing
        phase={state.phase}
        text={state.supervisorText}
        briefings={state.briefings}
      />

      {/* 2×2 archetype grid */}
      <main className="flex-1 p-4 grid grid-cols-2 gap-3" style={{ minHeight: "420px" }}>
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
      />

      <ValidationPanel validation={state.validation} />
    </div>
  )
}
