"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import { Streamdown } from "streamdown"
import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"

const streamdownPlugins = { cjk, code, math, mermaid }

interface PolicyBriefProps {
  markdown: string
  isStreaming?: boolean
  validated?: boolean
}

export function PolicyBrief({ markdown, isStreaming = false, validated = false }: PolicyBriefProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Policy Brief</CardTitle>
          {validated && (
            <Badge variant="default" className="gap-1.5">
              IFS Validated
            </Badge>
          )}
          {isStreaming && (
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              Streaming
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Conversation className="max-h-96 overflow-y-auto">
          <ConversationContent>
            {markdown ? (
              <div className="text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                <Streamdown plugins={streamdownPlugins}>{markdown}</Streamdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Policy brief will appear here after the simulation runs...
              </p>
            )}
          </ConversationContent>
        </Conversation>
      </CardContent>
    </Card>
  )
}
