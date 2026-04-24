"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SimulationHeader } from "@/components/simulation/simulation-header"
import { SupervisorCard } from "@/components/simulation/supervisor-card"
import { ArchetypeKPICard } from "@/components/simulation/archetype-kpi-card"
import { ArchetypeReactionCard } from "@/components/simulation/archetype-reaction-card"
import { StanceBarChart } from "@/components/simulation/stance-bar-chart"
import { PolicyBrief } from "@/components/simulation/policy-brief"
import { ValidationPanel } from "@/components/simulation/validation-panel"
import { useRunStream } from "@/hooks/useRunStream"
import { useCompletedRuns } from "@/hooks/useCompletedRuns"
import { createRun } from "@/lib/api"
import type {
  ArchetypeStreamState,
  ValidationResult,
  RunStarted,
  ArchetypeReaction,
} from "@/lib/types"

const ARCHETYPE_META: Record<string, { displayName: string; description: string }> = {
  citizen_low_income: {
    displayName: "Sarah",
    description: "Shop worker, London",
  },
  small_business: {
    displayName: "Mark",
    description: "Small business owner",
  },
  public_worker: {
    displayName: "Priya",
    description: "NHS nurse, Manchester",
  },
  pensioner: {
    displayName: "Arthur",
    description: "Pensioner, Bristol",
  },
}

export default function SimulationPage() {
  const [runId, setRunId] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState("")
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "done">("idle")
  const [mode, setMode] = useState<"live" | "replay">("live")
  const [replayRunId, setReplayRunId] = useState<string | null>(null)
  const [supervisorText, setSupervisorText] = useState("")
  const [briefMarkdown, setBriefMarkdown] = useState("")
  const [briefValidated, setBriefValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [briefStreaming, setBriefStreaming] = useState(false)

  const { runs: completedRuns } = useCompletedRuns()

  const [archetypes, setArchetypes] = useState<
    Record<string, ArchetypeStreamState>
  >({})

  const handlers = useMemo(
    () => ({
      onRunStarted: ({ run_id, archetype_ids }: RunStarted) => {
        setRunId(run_id)
        setRunStatus("running")
        const init: Record<string, ArchetypeStreamState> = {}
        archetype_ids.forEach((id) => {
          init[id] = {
            thinkingText: "",
            reactionText: "",
            isStreaming: true,
            reactionDone: false,
            reaction: null,
          }
        })
        setArchetypes(init)
        setSupervisorText("")
        setBriefMarkdown("")
        setBriefValidated(false)
        setValidationResult(null)
        setBriefStreaming(false)
      },

      onSupervisorText: ({ token }: { token: string }) => {
        setSupervisorText((prev) => prev + token)
      },

      onThinking: ({ archetype_id, token }: { archetype_id: string; token: string }) => {
        setArchetypes((prev) => {
          const a = prev[archetype_id]
          if (!a) return prev
          return {
            ...prev,
            [archetype_id]: {
              ...a,
              thinkingText: a.thinkingText + token,
            },
          }
        })
      },

      onReactionDelta: ({ archetype_id, token }: { archetype_id: string; token: string }) => {
        setArchetypes((prev) => {
          const a = prev[archetype_id]
          if (!a) return prev
          return {
            ...prev,
            [archetype_id]: {
              ...a,
              reactionText: a.reactionText + token,
            },
          }
        })
      },

      onReactionComplete: ({
        archetype_id,
        reaction,
      }: {
        archetype_id: string
        reaction: ArchetypeReaction
      }) => {
        setArchetypes((prev) => {
          const a = prev[archetype_id]
          if (!a) return prev
          return {
            ...prev,
            [archetype_id]: {
              ...a,
              isStreaming: false,
              reactionDone: true,
              reaction,
              reactionText: "",
            },
          }
        })
      },

      onBriefText: ({ token }: { token: string }) => {
        setBriefStreaming(true)
        setBriefMarkdown((prev) => prev + token)
      },

      onBriefDone: ({ markdown }: { markdown: string }) => {
        setBriefMarkdown(markdown)
        setBriefStreaming(false)
        setRunStatus("done")
      },

      onValidation: (data: ValidationResult) => {
        setValidationResult(data)
        setBriefValidated(true)
      },

      onDone: () => {
        setRunStatus((s) => (s === "running" ? "done" : s))
      },
    }),
    []
  )

  // runId to stream: use replayRunId when in replay mode, otherwise the newly created runId
  const activeRunId = mode === "replay" ? replayRunId : runId

  useRunStream(activeRunId, handlers, mode)

  const handleRun = useCallback(async () => {
    if (mode === "replay") {
      if (!replayRunId) return
      setRunId(replayRunId)
      setRunStatus("running")
      // Reset streams for replay
      setSupervisorText("")
      setBriefMarkdown("")
      setBriefValidated(false)
      setValidationResult(null)
      setBriefStreaming(false)
      const init: Record<string, ArchetypeStreamState> = {}
      Object.keys(ARCHETYPE_META).forEach((id) => {
        init[id] = {
          thinkingText: "",
          reactionText: "",
          isStreaming: true,
          reactionDone: false,
          reaction: null,
        }
      })
      setArchetypes(init)
      return
    }
    if (!selectedScenario) return
    try {
      const { run_id } = await createRun(selectedScenario)
      setRunId(run_id)
    } catch (err) {
      console.error("Failed to create run:", err)
    }
  }, [mode, selectedScenario, replayRunId])

  // Archetype IDs in display order
  const archetypeIds = useMemo(() => Object.keys(archetypes), [archetypes])

  // Stance chart data
  const stanceScores = useMemo(() => {
    return archetypeIds
      .map((id) => {
        const meta = ARCHETYPE_META[id]
        const score = archetypes[id]?.reaction?.support_or_oppose
          ? Math.round(archetypes[id].reaction!.support_or_oppose * 100)
          : null
        return score !== null && meta
          ? { name: id, displayName: meta.displayName, score }
          : null
      })
      .filter(Boolean) as Array<{ name: string; displayName: string; score: number }>
  }, [archetypeIds, archetypes])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader
          title="Simulation"
          actions={
            <span className="text-sm text-muted-foreground">
              {runStatus === "running"
                ? "Simulation running..."
                : runStatus === "done"
                ? "Simulation complete"
                : "Ready"}
            </span>
          }
        />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Header with scenario selector */}
          <div className="flex items-center gap-4 flex-wrap">
            <SimulationHeader
              selectedScenario={selectedScenario}
              onScenarioChange={setSelectedScenario}
              onRun={handleRun}
              isRunning={runStatus === "running"}
              disabled={!selectedScenario}
              mode={mode}
              onModeChange={setMode}
              replayRunId={replayRunId ?? undefined}
              onReplayRunIdChange={setReplayRunId}
              completedRuns={completedRuns}
            />
          </div>

          {/* Supervisor briefing */}
          <SupervisorCard
            text={supervisorText}
            isStreaming={runStatus === "running" && !supervisorText.includes("\n\n")}
          />

          {/* KPI Row: 4 archetype cards — always visible */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Object.entries(ARCHETYPE_META).map(([id, meta]) => {
              const state = archetypes[id]
              return (
                <ArchetypeKPICard
                  key={id}
                  archetypeId={id}
                  displayName={meta.displayName}
                  description={meta.description}
                  state={state ?? {
                    thinkingText: "",
                    reactionText: "",
                    isStreaming: false,
                    reactionDone: false,
                    reaction: null,
                  }}
                />
              )
            })}
          </div>

          {/* Stance chart (shown when reactions are complete) */}
          {stanceScores.length > 0 && (
            <StanceBarChart scores={stanceScores} />
          )}

          {/* 2x2 Archetype reaction cards */}
          {archetypeIds.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {archetypeIds.map((id) => {
                const meta = ARCHETYPE_META[id] ?? {
                  displayName: id,
                  description: "",
                }
                return (
                  <ArchetypeReactionCard
                    key={id}
                    archetypeId={id}
                    displayName={meta.displayName}
                    description={meta.description}
                    state={archetypes[id]}
                  />
                )
              })}
            </div>
          )}

          {/* Policy brief */}
          <PolicyBrief
            markdown={briefMarkdown}
            isStreaming={briefStreaming}
            validated={briefValidated}
          />

          {/* IFS Validation */}
          {validationResult && <ValidationPanel result={validationResult} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
