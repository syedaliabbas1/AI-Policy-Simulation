"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"

const archetypes = [
  { name: "Sarah", role: "Shop worker, London", desc: "Low-income household, highly sensitive to VAT changes on everyday goods. Represents the bottom income quintile." },
  { name: "Mark", role: "Small business owner", desc: "VAT-registered trader with complex supply chains. Affected by both input/output VAT and consumer demand shifts." },
  { name: "Priya", role: "NHS nurse, Manchester", desc: "Middle-income public sector worker. Balances disposable income impact against broader public service funding." },
  { name: "Arthur", role: "Pensioner, Bristol", desc: "Fixed-income retiree with high spending on VAT-liable goods. Represents the older demographic's policy exposure." },
]

export default function HelpPage() {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Get Help" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 max-w-3xl">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What is Poligent?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Poligent is an AI-driven UK fiscal policy simulation platform. It takes a policy document
                as input and runs four AI agents — each embodying a different population archetype — who
                reason about the policy from their personal perspective using Claude Opus 4.7 with extended thinking.
              </p>
              <p>
                The simulation concludes with a synthesised policy brief, validated against distributional
                findings from the Institute for Fiscal Studies (IFS).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Accordion className="w-full">
                <AccordionItem value="run">
                  <AccordionTrigger>How do I run a simulation?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Go to the <strong>Simulation</strong> page from the sidebar.</p>
                    <p>2. Select a policy scenario from the dropdown (e.g. "UK VAT Rise 2010").</p>
                    <p>3. Click <strong>Run</strong>. The simulation takes 2–4 minutes to complete.</p>
                    <p>4. Watch the four archetype cards populate in real time as each agent reasons through the policy.</p>
                    <p>5. A policy brief is generated and validated against IFS data once all archetypes complete.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="replay">
                  <AccordionTrigger>What is Replay mode?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Replay streams a previously completed run from cached data — no API calls are made.
                    Switch to the <strong>Replay</strong> tab, select a run, and click Replay to re-watch
                    the simulation at the original speed. Useful for demos without incurring API costs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="archetypes">
                  <AccordionTrigger>Who are the four archetypes?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-1">
                      {archetypes.map((a) => (
                        <div key={a.name}>
                          <p className="text-sm font-medium">{a.name} — {a.role}</p>
                          <p className="text-sm text-muted-foreground">{a.desc}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scores">
                  <AccordionTrigger>What do the stance scores mean?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Each archetype returns a score from <strong>-100</strong> (strongly opposed) to
                      <strong> +100</strong> (strongly supportive) of the policy.
                    </p>
                    <p>
                      Scores are derived from the archetype's <code>support_or_oppose</code> field
                      (a -1.0 to 1.0 float) multiplied by 100.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ifs">
                  <AccordionTrigger>What is IFS Validation?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      After a run completes, the simulation validates the archetype scores against
                      IFS distributional data for the same policy.
                    </p>
                    <p>
                      Four checks are run: directional alignment (do scores match IFS-expected sign?),
                      ordering (are archetypes ranked as IFS would predict?), concern/rationale overlap,
                      and hallucination detection.
                    </p>
                    <p>
                      Access IFS results via the <strong>IFS Check</strong> page or the Dashboard action button.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="compare">
                  <AccordionTrigger>How do I compare two scenarios?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Go to <strong>Compare</strong>. Add two or more run IDs (e.g. <code>uk_vat_2010</code> and
                    <code> uk_vat_cut_hypothetical</code>). The page renders a side-by-side stance chart and
                    briefs for each run. You can also deep-link from the Dashboard using the Compare action button.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
