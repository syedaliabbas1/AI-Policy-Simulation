"use client"

import { useScenarios } from "@/hooks/useScenarios"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlayerPlay, IconLoader, IconRepeat } from "@tabler/icons-react"

export interface CompletedRunItem {
  run_id: string
  scenario_path: string
  created_at?: string
}

export interface SimulationHeaderProps {
  selectedScenario: string
  onScenarioChange: (path: string) => void
  onRun: () => void
  isRunning?: boolean
  disabled?: boolean
  mode?: "live" | "replay"
  onModeChange?: (mode: "live" | "replay") => void
  replayRunId?: string
  onReplayRunIdChange?: (id: string) => void
  completedRuns?: CompletedRunItem[]
}

export function SimulationHeader({
  selectedScenario,
  onScenarioChange,
  onRun,
  isRunning = false,
  disabled = false,
  mode = "live",
  onModeChange,
  replayRunId,
  onReplayRunIdChange,
  completedRuns = [],
}: SimulationHeaderProps) {
  const { scenarios, loading } = useScenarios()
  const isDisabled = isRunning || loading

  const replayRuns = completedRuns
    .map((r) => ({
      run_id: r.run_id,
      label: r.scenario_path
        ? r.scenario_path
            .replace(/\\/g, "/")
            .split("/")
            .pop()
            ?.replace(/\.(md|json)$/, "")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? r.run_id
        : r.run_id,
      created_at: r.created_at,
    }))
    .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))

  return (
    <div className="flex items-center gap-3 px-4 lg:px-6">
      {/* Live / Replay toggle */}
      <div className="flex items-center border border-border rounded-md overflow-hidden shrink-0">
        {(["live", "replay"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange?.(m)}
            disabled={isRunning}
            className={[
              "px-3 py-1.5 text-sm transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {m === "replay" ? (
              <span className="flex items-center gap-1">
                <IconRepeat className="size-3" />
                Replay
              </span>
            ) : (
              "Live"
            )}
          </button>
        ))}
      </div>

      {mode === "live" ? (
        <Select
          items={scenarios}
          value={selectedScenario}
          onValueChange={onScenarioChange}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a scenario..." />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.path} value={s.path}>
                {s.label ?? s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select
          items={replayRuns}
          value={replayRunId ?? ""}
          onValueChange={(v) => onReplayRunIdChange?.(v)}
          disabled={isRunning}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a run to replay..." />
          </SelectTrigger>
          <SelectContent>
            {replayRuns.length === 0 && (
              <SelectItem value="__empty__" disabled>
                No completed runs
              </SelectItem>
            )}
            {replayRuns.map((r) => (
              <SelectItem key={r.run_id} value={r.run_id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        onClick={onRun}
        disabled={
          isDisabled ||
          (mode === "live" && !selectedScenario) ||
          (mode === "replay" && !replayRunId)
        }
      >
        {isRunning ? (
          <IconLoader data-icon="inline-start" className="animate-spin" />
        ) : (
          <IconPlayerPlay data-icon="inline-start" />
        )}
        {isRunning ? "Running..." : mode === "replay" ? "Replay" : "Run"}
      </Button>
    </div>
  )
}
