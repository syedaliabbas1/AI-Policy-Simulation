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
import { IconPlayerPlay, IconLoader } from "@tabler/icons-react"

export interface SimulationHeaderProps {
  selectedScenario: string
  onScenarioChange: (path: string) => void
  onRun: () => void
  isRunning?: boolean
  disabled?: boolean
}

export function SimulationHeader({
  selectedScenario,
  onScenarioChange,
  onRun,
  isRunning = false,
  disabled = false,
}: SimulationHeaderProps) {
  const { scenarios, loading } = useScenarios()

  return (
    <div className="flex items-center gap-3 px-4 lg:px-6">
      <Select
        items={scenarios}
        value={selectedScenario}
        onValueChange={onScenarioChange}
        disabled={disabled || isRunning}
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

      <Button
        onClick={onRun}
        disabled={disabled || isRunning || !selectedScenario || loading}
      >
        {isRunning ? (
          <IconLoader data-icon="inline-start" className="animate-spin" />
        ) : (
          <IconPlayerPlay data-icon="inline-start" />
        )}
        {isRunning ? "Running..." : "Run"}
      </Button>
    </div>
  )
}
