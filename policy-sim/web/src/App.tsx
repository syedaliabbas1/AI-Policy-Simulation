"use client"
import { useState } from "react"
import { ThemeProvider } from "next-themes"
import { useRunStream } from "@/hooks/useRunStream"
import { PolicyInput } from "@/components/PolicyInput"
import { SupervisorBriefing } from "@/components/SupervisorBriefing"
import { ArchetypeCard } from "@/components/ArchetypeCard"
import { BriefDisplay } from "@/components/BriefDisplay"
import { ValidationPanel } from "@/components/ValidationPanel"
import { Sidebar } from "@/components/Sidebar"
import { Card } from "@/components/tremor/Card"
import { ComparePage } from "@/pages/ComparePage"
import { DashboardPage } from "@/pages/DashboardPage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tremor/Tabs"
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

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-500 truncate">{name}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
        {stance !== null ? (stance > 0 ? "+" : "") + stance.toFixed(2) : "—"}
      </p>
    </Card>
  )
}

function SimulationView() {
  const { state, start, stop } = useRunStream()
  const displayIds = state.archetypeIds.length > 0 ? state.archetypeIds : ARCHETYPE_ORDER
  const showKPI = state.phase === "reacting" || state.phase === "reporting" || state.phase === "done"

  return (
    <div className="flex flex-col min-h-screen">
      <PolicyInput phase={state.phase} onRun={start} onStop={stop} />
      <SupervisorBriefing
        phase={state.phase}
        text={state.supervisorText}
        briefings={state.briefings}
      />

      {/* KPI row */}
      {showKPI && (
        <div className="max-w-screen-xl mx-auto w-full px-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {displayIds.map((id) => (
              <KPICard key={id} archetypeId={id} state={state.archetypes[id]} />
            ))}
          </div>
        </div>
      )}

      {/* Archetype grid — 2×2 on md+, tabs below md */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full p-4">
        <div className="hidden md:grid md:grid-cols-2 gap-3" style={{ minHeight: "420px" }}>
          {displayIds.map((id) => (
            <ArchetypeCard
              key={id}
              archetypeId={id}
              archetypeState={state.archetypes[id]}
              briefing={state.briefings[id]}
            />
          ))}
        </div>

        {/* Mobile tabs (<md) */}
        <div className="md:hidden">
          <Tabs defaultValue={displayIds[0]}>
            <TabsList className="mb-3">
              {displayIds.map((id) => (
                <TabsTrigger key={id} value={id}>
                  {ARCHETYPE_NAMES[id] ?? id}
                </TabsTrigger>
              ))}
            </TabsList>
            {displayIds.map((id) => (
              <TabsContent key={id} value={id} className="mt-0">
                <ArchetypeCard
                  archetypeId={id}
                  archetypeState={state.archetypes[id]}
                  briefing={state.briefings[id]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
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

export default function App() {
  const [activeView, setActiveView] = useState("simulation")

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-white dark:bg-gray-950">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main content — no offset on mobile, sidebar offset from lg+ */}
        <main className="flex-1 lg:pl-72">
          {activeView === "simulation" && <SimulationView />}
          {activeView === "compare" && <ComparePage />}
          {activeView === "dashboard" && <DashboardPage />}
          {activeView === "ifs-validation" && (
            <div className="px-4 md:px-6 py-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-50">IFS Validation</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                IFS validation data and comparisons shown here.
              </p>
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
