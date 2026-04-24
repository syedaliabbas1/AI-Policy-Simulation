"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import { Streamdown } from "streamdown"
import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import { IconPlayerPause } from "@tabler/icons-react"

const streamdownPlugins = { cjk, code, math, mermaid }

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
            {text ? (
              <div className="text-sm leading-relaxed text-muted-foreground">
                <Streamdown plugins={streamdownPlugins}>{text}</Streamdown>
              </div>
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
