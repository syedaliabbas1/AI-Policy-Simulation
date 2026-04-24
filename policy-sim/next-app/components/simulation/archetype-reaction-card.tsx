"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import type { ArchetypeStreamState } from "@/lib/types"

interface ArchetypeReactionCardProps {
  archetypeId: string
  displayName: string
  description: string
  state: ArchetypeStreamState
}

function scoreColor(score: number): "default" | "destructive" {
  return score >= 0 ? "default" : "destructive"
}

function formatScore(score: number): string {
  const sign = score > 0 ? "+" : ""
  return `${sign}${Math.round(score)}`
}

export function ArchetypeReactionCard({
  displayName,
  description,
  state,
}: ArchetypeReactionCardProps) {
  const score = state.reaction?.support_or_oppose
    ? Math.round(state.reaction.support_or_oppose * 100)
    : null

  const concerns = state.reaction?.concerns ?? []
  const rationale = state.reaction?.rationale ?? state.reactionText

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-full text-white font-semibold text-sm"
              style={{ backgroundColor: score !== null && score < 0 ? "var(--destructive)" : "var(--primary)" }}
            >
              {displayName[0]}
            </div>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </div>
          {score !== null && (
            <Badge variant={scoreColor(score)}>{formatScore(score)}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <Reasoning isStreaming={state.isStreaming && !state.reactionDone}>
          <ReasoningTrigger />
          <ReasoningContent>{state.thinkingText}</ReasoningContent>
        </Reasoning>

        {state.reactionDone && rationale && (
          <div className="flex flex-col gap-2">
            {concerns.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {concerns.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {rationale}
            </p>
          </div>
        )}

        {!state.reactionDone && state.reactionText && (
          <p className="text-sm text-muted-foreground leading-relaxed animate-pulse">
            {state.reactionText}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
