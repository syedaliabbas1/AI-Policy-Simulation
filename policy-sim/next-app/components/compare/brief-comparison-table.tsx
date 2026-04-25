"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Streamdown } from "streamdown"
import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import type { CompareBrief } from "@/lib/types"

const streamdownPlugins = { cjk, code, math, mermaid }

interface BriefComparisonTableProps {
  briefs: CompareBrief[]
}

export function BriefComparisonTable({ briefs }: BriefComparisonTableProps) {
  if (briefs.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Policy Briefs</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={briefs[0].run_id} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-1">
            {briefs.map((brief) => (
              <TabsTrigger key={brief.run_id} value={brief.run_id}>
                {brief.policy_label ?? brief.run_id.slice(0, 8)}
              </TabsTrigger>
            ))}
          </TabsList>
          {briefs.map((brief) => (
            <TabsContent key={brief.run_id} value={brief.run_id} className="mt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                <Streamdown plugins={streamdownPlugins}>
                  {brief.markdown}
                </Streamdown>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
