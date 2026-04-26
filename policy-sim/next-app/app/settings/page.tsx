"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { checkHealth } from "@/lib/api"
import { useScenarios } from "@/hooks/useScenarios"
import { IconCircleCheck, IconCircleX, IconRefresh } from "@tabler/icons-react"

export default function SettingsPage() {
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const { scenarios, loading: scenariosLoading } = useScenarios()

  async function pingHealth() {
    setHealth("checking")
    try {
      await checkHealth()
      setHealth("ok")
    } catch {
      setHealth("error")
    }
    setLastChecked(new Date())
  }

  useEffect(() => { pingHealth() }, [])

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 max-w-2xl">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Backend Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {health === "checking" && <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />}
                {health === "ok" && <IconCircleCheck className="size-4 text-green-500" />}
                {health === "error" && <IconCircleX className="size-4 text-destructive" />}
                <span className="text-sm">
                  {health === "checking" && "Checking..."}
                  {health === "ok" && "Azure backend reachable"}
                  {health === "error" && "Backend unreachable"}
                </span>
                {lastChecked && (
                  <span className="text-xs text-muted-foreground">
                    — last checked {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={pingHealth} disabled={health === "checking"}>
                <IconRefresh className="size-3.5" />
                Refresh
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Simulation (archetypes + reporter)</span>
                <Badge variant="outline" className="font-mono text-xs">claude-opus-4-7</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Policy Assistant</span>
                <Badge variant="outline" className="font-mono text-xs">claude-haiku-4-5</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Extended thinking</span>
                <Badge variant="outline" className="text-xs">adaptive, effort=high</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Available Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scenariosLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
              {scenarios.map((s) => (
                <div key={s.path} className="flex items-center justify-between text-sm">
                  <span>{s.label ?? s.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">{s.name}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Poligent — AI-driven UK fiscal policy simulation platform.</p>
              <p>Ingests policy documents, streams parallel archetype reasoning via Claude Opus 4.7 with extended thinking, and produces policy briefs validated against IFS distributional findings.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline">Next.js</Badge>
                <Badge variant="outline">FastAPI</Badge>
                <Badge variant="outline">Claude API</Badge>
                <Badge variant="outline">Azure App Service</Badge>
                <Badge variant="outline">Vercel</Badge>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
