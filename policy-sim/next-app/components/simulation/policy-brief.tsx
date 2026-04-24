"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"

interface PolicyBriefProps {
  markdown: string
  isStreaming?: boolean
  validated?: boolean
}

export function PolicyBrief({ markdown, isStreaming = false, validated = false }: PolicyBriefProps) {
  const [streamdown, setStreamdown] = useState<typeof import("streamdown") | null>(null)
  const [plugins, setPlugins] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    Promise.all([
      import("streamdown"),
      import("@streamdown/cjk"),
      import("@streamdown/code"),
      import("@streamdown/math"),
      import("@streamdown/mermaid"),
    ]).then(([sd, cjk, code, math, mermaid]) => {
      setStreamdown(sd)
      setPlugins({ cjk, code, math, mermaid })
    })
  }, [])

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
                {streamdown && plugins ? (
                  <streamdown.Streamdown plugins={plugins}>{markdown}</streamdown.Streamdown>
                ) : (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-5/6 rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                  </div>
                )}
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
