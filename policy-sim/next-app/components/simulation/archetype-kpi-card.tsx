"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import type { ArchetypeStreamState } from "@/lib/types"

interface ArchetypeKPICardProps {
  archetypeId: string
  displayName: string
  description: string
  state: ArchetypeStreamState
}

function scoreToProgress(score: number): number {
  // score is -100 to +100 → map to 0-100
  return Math.round((score + 100) / 2)
}

function scoreColor(score: number): string {
  return score >= 0 ? "bg-[var(--chart-1)]" : "bg-destructive"
}

function scoreBadgeVariant(score: number): "default" | "destructive" {
  return score >= 0 ? "default" : "destructive"
}

function formatScore(score: number): string {
  const sign = score > 0 ? "+" : ""
  return `${sign}${Math.round(score)}`
}

const ARCHETYPE_IMAGE: Record<string, string> = {
  citizen_low_income: "/sarah.png",
  small_business: "/mark.png",
  public_worker: "/priya.png",
  pensioner: "/arthur.png",
}

export function ArchetypeKPICard({
  displayName,
  description,
  state,
  archetypeId,
}: ArchetypeKPICardProps) {
  const score = state.reaction?.support_or_oppose
    ? Math.round(state.reaction.support_or_oppose * 100)
    : null

  const imagePath = ARCHETYPE_IMAGE[archetypeId]

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          {imagePath ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imagePath}
              alt={displayName}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {displayName[0]}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </div>

        {score !== null ? (
          <>
            <Badge variant={scoreBadgeVariant(score)}>
              {formatScore(score)}
            </Badge>
            <Progress value={scoreToProgress(score)} className="h-2">
              <ProgressTrack>
                <ProgressIndicator className={scoreColor(score)} />
              </ProgressTrack>
            </Progress>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-pulse rounded-full bg-muted" />
            {state.isStreaming ? "Thinking..." : "Waiting..."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
