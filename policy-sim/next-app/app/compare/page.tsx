"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RunSelector } from "@/components/compare/run-selector"
import { StanceComparisonChart } from "@/components/compare/stance-comparison-chart"
import { BriefComparisonTable } from "@/components/compare/brief-comparison-table"
import { compareRuns, compareBriefs } from "@/lib/api"
import type { CompareResponse, CompareBriefsResponse } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"

function ComparePageInner() {
  const searchParams = useSearchParams()
  const runsParam = searchParams.get("runs")

  const [selectedRuns, setSelectedRuns] = useState<string[]>(
    runsParam ? runsParam.split(",").filter(Boolean) : []
  )
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [briefsData, setBriefsData] = useState<CompareBriefsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedRuns.length < 2) {
      setCompareData(null)
      setBriefsData(null)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([compareRuns(selectedRuns), compareBriefs(selectedRuns)])
      .then(([compare, briefs]) => {
        setCompareData(compare)
        setBriefsData(briefs)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load comparison")
        setLoading(false)
      })
  }, [selectedRuns])

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
        <SiteHeader title="Compare" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <RunSelector selected={selectedRuns} onChange={setSelectedRuns} />

          {error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Loading comparison...</p>
              </CardContent>
            </Card>
          )}

          {compareData && compareData.runs.length > 0 && (
            <StanceComparisonChart runs={compareData.runs} />
          )}

          {briefsData && briefsData.briefs.length > 0 && (
            <BriefComparisonTable briefs={briefsData.briefs} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  )
}
