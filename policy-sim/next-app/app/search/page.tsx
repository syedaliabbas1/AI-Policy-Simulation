"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCompletedRuns } from "@/hooks/useCompletedRuns"
import { useScenarios } from "@/hooks/useScenarios"
import { listDocuments } from "@/lib/api"
import { IconSearch, IconFileText, IconChartBar } from "@tabler/icons-react"

interface Doc { id: string; title: string; filename: string }

export default function SearchPage() {
  const { runs } = useCompletedRuns()
  const { scenarios } = useScenarios()
  const [docs, setDocs] = useState<Doc[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    listDocuments().then((d) => setDocs(d.documents ?? [])).catch(() => {})
  }, [])

  function scenarioLabel(path: string) {
    return scenarios.find((s) => s.path === path)?.label
      ?? path.replace(/\\/g, "/").split("/").pop()?.replace(/\.(md|json)$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      ?? path
  }

  const q = query.toLowerCase().trim()

  const matchingRuns = useMemo(() =>
    q ? runs.filter((r) =>
      r.run_id.toLowerCase().includes(q) ||
      scenarioLabel(r.scenario_path).toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    ) : [],
    [q, runs, scenarios]
  )

  const matchingDocs = useMemo(() =>
    q ? docs.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.filename.toLowerCase().includes(q)
    ) : [],
    [q, docs]
  )

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Search" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search runs, scenarios, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {q && matchingRuns.length === 0 && matchingDocs.length === 0 && (
            <p className="text-sm text-muted-foreground">No results for "{query}"</p>
          )}

          {matchingRuns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Simulation Runs</p>
              <div className="space-y-2">
                {matchingRuns.map((r) => (
                  <Card key={r.run_id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconChartBar className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{scenarioLabel(r.scenario_path)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.run_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === "completed" ? "default" : "outline"} className="text-xs">
                          {r.status}
                        </Badge>
                        <Link href={`/ifs?run=${r.run_id}`} className="text-xs text-primary hover:underline">IFS</Link>
                        <Link href={`/compare?runs=${r.run_id}`} className="text-xs text-primary hover:underline">Compare</Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {matchingDocs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Documents</p>
              <div className="space-y-2">
                {matchingDocs.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconFileText className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{d.filename}</p>
                        </div>
                      </div>
                      <Link href="/library" className="text-xs text-primary hover:underline">Open</Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!q && (
            <p className="text-sm text-muted-foreground">
              Type to search across simulation runs and policy documents.
            </p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
