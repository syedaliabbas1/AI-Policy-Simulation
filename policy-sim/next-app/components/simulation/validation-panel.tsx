"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"
import type { ValidationResult } from "@/lib/types"

interface ValidationPanelProps {
  result: ValidationResult | null
}

function CheckIcon({ pass }: { pass: boolean }) {
  return pass ? (
    <IconCheck className="size-4 text-[var(--chart-1)]" />
  ) : (
    <IconX className="size-4 text-destructive" />
  )
}

const checkLabels: Record<keyof ValidationResult["checks"], string> = {
  directional: "Directional Accuracy",
  ordering: "Ordering",
  concern_rationale_overlap: "Concern-Rationale Overlap",
  no_hallucinated_policy: "Policy Hallucination",
}

const checkDescriptions: Record<keyof ValidationResult["checks"], string> = {
  directional:
    "Each archetype's stance sign matches the IFS expected direction for their demographic group.",
  ordering:
    "Stance scores are ranked in the correct order matching IFS distributional analysis.",
  concern_rationale_overlap:
    "Archetype concerns appear in the policy brief rationale with sufficient overlap.",
  no_hallucinated_policy:
    "No policy elements are hallucinated that contradict the source document.",
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  if (!result) return null

  const checks = result.checks

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">IFS Validation</CardTitle>
          <Badge variant={result.overall_pass ? "default" : "destructive"}>
            {result.overall_pass ? "Passed" : "Failed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {(Object.keys(checks) as Array<keyof ValidationResult["checks"]>).map(
            (key) => {
              const check = checks[key]
              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <CheckIcon pass={check.pass} />
                      {checkLabels[key]}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 text-sm">
                    <p className="text-muted-foreground">{checkDescriptions[key]}</p>
                    {check.detail && (
                      <p className="text-muted-foreground italic">{check.detail}</p>
                    )}
                    {check.note && (
                      <p className="text-muted-foreground italic">{check.note}</p>
                    )}
                    {check.details && (
                      <div className="mt-2 flex flex-col gap-1">
                        {Object.entries(check.details).map(([id, detail]) => (
                          <div
                            key={id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <CheckIcon
                              pass={(detail as { pass?: boolean }).pass ?? false}
                            />
                            <span>{id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            }
          )}
        </Accordion>
      </CardContent>
    </Card>
  )
}
