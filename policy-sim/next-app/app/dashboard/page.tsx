"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { listRuns } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconChartBar, IconChecklist, IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

interface RunSummary {
  run_id: string
  status: string
  created_at: string
  scenario_path: string
}

function scenarioLabel(path: string): string {
  if (!path) return "—"
  try {
    const parts = path.replace(/\\/g, "/").split("/")
    const filename = parts[parts.length - 1]
    return filename.replace(/\.(md|json)$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return path.split("/").pop() ?? "—"
  }
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge variant="secondary">Completed</Badge>
    case "running":
      return <Badge variant="default">Running</Badge>
    case "error":
      return <Badge variant="destructive">Error</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function DashboardPage() {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRuns()
      .then((data) => setRuns(data.runs))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load runs"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Simulation Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-sm text-muted-foreground">Loading runs...</p>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {!loading && !error && runs.length === 0 && (
                <p className="text-sm text-muted-foreground">No simulation runs yet. Go to Simulation to start one.</p>
              )}
              {!loading && !error && runs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.run_id}>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{run.run_id.slice(0, 12)}…</span>
                        </TableCell>
                        <TableCell className="text-sm">{scenarioLabel(run.scenario_path)}</TableCell>
                        <TableCell><StatusBadge status={run.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(run.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button render={<Link href={`/ifs?run=${run.run_id}`} />} size="sm" variant="ghost" className="h-7 gap-1">
                              <IconChecklist data-icon="inline-start" className="size-3" />
                              IFS
                            </Button>
                            <Button render={<Link href={`/compare?runs=${run.run_id}`} />} size="sm" variant="ghost" className="h-7 gap-1">
                              <IconChartBar data-icon="inline-start" className="size-3" />
                              Compare
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}