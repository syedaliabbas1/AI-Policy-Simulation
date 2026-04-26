"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Streamdown } from "streamdown"
import { useCompletedRuns } from "@/hooks/useCompletedRuns"
import { useScenarios } from "@/hooks/useScenarios"
import { getBrief } from "@/lib/api"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

export default function ReportsPage() {
  const { runs, loading } = useCompletedRuns()
  const { scenarios } = useScenarios()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<Record<string, string>>({})
  const [fetching, setFetching] = useState<string | null>(null)

  const completed = runs.filter((r) => r.status === "completed")

  function scenarioLabel(path: string) {
    return scenarios.find((s) => s.path === path)?.label
      ?? path.replace(/\\/g, "/").split("/").pop()?.replace(/\.(md|json)$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      ?? path
  }

  async function toggle(runId: string) {
    if (expanded === runId) { setExpanded(null); return }
    setExpanded(runId)
    if (!briefs[runId]) {
      setFetching(runId)
      try {
        const { markdown } = await getBrief(runId)
        setBriefs((prev) => ({ ...prev, [runId]: markdown }))
      } finally {
        setFetching(null)
      }
    }
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Reports" />
        <div className="flex flex-1 flex-col gap-3 p-4 lg:p-6">
          {loading && <p className="text-sm text-muted-foreground">Loading reports...</p>}
          {!loading && completed.length === 0 && (
            <p className="text-sm text-muted-foreground">No completed simulation runs yet. Run a simulation first.</p>
          )}
          {completed.map((run) => (
            <Card key={run.run_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{scenarioLabel(run.scenario_path)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{run.run_id}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(run.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggle(run.run_id)}>
                    {expanded === run.run_id ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                    {expanded === run.run_id ? "Collapse" : "View Brief"}
                  </Button>
                </div>
                {expanded === run.run_id && (
                  <div className="mt-4 border-t pt-4">
                    {fetching === run.run_id ? (
                      <p className="text-sm text-muted-foreground">Loading brief...</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                        <Streamdown>{briefs[run.run_id] ?? ""}</Streamdown>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
