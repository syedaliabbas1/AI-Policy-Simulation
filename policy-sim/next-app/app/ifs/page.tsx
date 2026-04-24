"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ValidationPanel } from "@/components/simulation/validation-panel"
import { getValidation, compareRuns } from "@/lib/api"
import type { ValidationResult, CompareRun } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StanceBarChart } from "@/components/simulation/stance-bar-chart"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function IFSPage() {
  const searchParams = useSearchParams()
  const runIdParam = searchParams.get("run")

  const [runId, setRunId] = useState(runIdParam ?? "")
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [stanceScores, setStanceScores] = useState<Array<{ name: string; displayName: string; score: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    if (!runId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const [validation, compare] = await Promise.all([
        getValidation(runId),
        compareRuns([runId]),
      ])
      setValidationResult(validation)

      const run = compare.runs[0]
      if (run) {
        const scores = Object.entries(run.archetype_scores).map(([id, data]) => ({
          name: id,
          displayName: data.name,
          score: Math.round(data.score * 100),
        }))
        setStanceScores(scores)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load validation")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runIdParam) {
      handleLoad()
    }
  }, [runIdParam])

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
        <SiteHeader title="IFS Validation" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Input
                placeholder="Enter run ID..."
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoad()}
                className="w-64"
              />
              <Button onClick={handleLoad} disabled={loading || !runId.trim()}>
                {loading ? "Loading..." : "Load"}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {validationResult && (
            <>
              {stanceScores.length > 0 && (
                <StanceBarChart scores={stanceScores} title="Stance Scores" />
              )}
              <ValidationPanel result={validationResult} />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
