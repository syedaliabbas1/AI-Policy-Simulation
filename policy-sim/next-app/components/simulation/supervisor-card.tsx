"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"

interface SupervisorCardProps {
  text: string
  isStreaming?: boolean
}

export function SupervisorCard({ text, isStreaming = false }: SupervisorCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Supervisor</CardTitle>
          {isStreaming && (
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              Streaming
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Conversation className="max-h-64 overflow-y-auto">
          <ConversationContent>
            {isStreaming ? (
              <p className="text-sm text-muted-foreground italic">
                Generating personalised briefings for each archetype...
              </p>
            ) : text ? (
              <p className="text-sm text-muted-foreground italic">
                Briefings complete — see archetype cards below.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Briefing will appear here...
              </p>
            )}
          </ConversationContent>
        </Conversation>
      </CardContent>
    </Card>
  )
}
