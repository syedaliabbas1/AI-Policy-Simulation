"use client"

import { useState, useRef, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useCompletedRuns } from "@/hooks/useCompletedRuns"
import { useScenarios } from "@/hooks/useScenarios"
import { sendAssistantMessage } from "@/lib/api"
import { IconSend } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AssistantPage() {
  const { runs } = useCompletedRuns()
  const { scenarios } = useScenarios()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [runId, setRunId] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const completed = runs.filter((r) => r.status === "completed")

  function scenarioLabel(path: string) {
    return scenarios.find((s) => s.path === path)?.label
      ?? path.replace(/\\/g, "/").split("/").pop()?.replace(/\.(md|json)$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      ?? path
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next: Message[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setInput("")
    setLoading(true)
    try {
      const { content } = await sendAssistantMessage(next, runId || undefined)
      setMessages([...next, { role: "assistant", content }])
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, something went wrong. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Policy Assistant" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <p className="text-sm text-muted-foreground shrink-0">Ground in run:</p>
              <Select value={runId} onValueChange={setRunId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="No specific run (general)">
                    {runId
                      ? completed.find((r) => r.run_id === runId)
                          ? scenarioLabel(completed.find((r) => r.run_id === runId)!.scenario_path)
                          : runId
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific run (general)</SelectItem>
                  {completed.map((r) => (
                    <SelectItem key={r.run_id} value={r.run_id}>
                      {scenarioLabel(r.scenario_path)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                  Clear chat
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col flex-1 min-h-0">
            <CardContent className="flex flex-col flex-1 min-h-0 p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center">
                      Ask anything about UK fiscal policy or the simulation results.
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t p-4 flex gap-2">
                <Textarea
                  placeholder="Ask about archetype reactions, policy impacts, IFS validation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                  className="resize-none min-h-[60px] max-h-32"
                  rows={2}
                />
                <Button onClick={send} disabled={!input.trim() || loading} size="icon" className="self-end shrink-0">
                  <IconSend className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
