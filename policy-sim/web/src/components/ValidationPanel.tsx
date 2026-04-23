import type { ValidationResult } from "@/lib/events"
import { Badge } from "./tremor/Badge"
import { Callout } from "./tremor/Callout"
import { Divider } from "./tremor/Divider"

interface Props {
  validation: ValidationResult | null
}

export function ValidationPanel({ validation }: Props) {
  if (!validation) return null

  const dir = validation.directional as Record<string, { pass: boolean }> | undefined
  const ic  = validation.internal_consistency as Record<string, boolean> | undefined
  const allDirectional = dir ? Object.values(dir).every((v) => v.pass) : false
  const hasError = !!validation.error

  return (
    <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#090E1A]">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">IFS Validation</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">2011 Distributional Study — Directional Comparison</p>
          </div>
        </div>

        {hasError ? (
          <Callout title="Validation Error" variant="error">
            {validation.error as string}
          </Callout>
        ) : (
          <div className="space-y-5">
            {dir && (
              <div className="rounded-md p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <span className="block mb-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                  Directional alignment — archetype vs IFS findings
                </span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={allDirectional ? "success" : "error"}>
                    Overall {allDirectional ? "Aligned" : "Misaligned"}
                  </Badge>
                  {Object.entries(dir).map(([id, result]) => (
                    <Badge key={id} variant={result.pass ? "success" : "error"}>
                      {id.replace(/_/g, " ")} {result.pass ? "✓" : "✗"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {ic && (
              <div className="rounded-md p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <span className="block mb-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                  Internal consistency checks
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ic).map(([check, pass]) => (
                    <Badge key={check} variant={pass ? "success" : "error"}>
                      {check.replace(/_/g, " ")} {pass ? "✓" : "✗"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Divider>
              <span className="text-xs text-gray-400 dark:text-gray-600">Note</span>
            </Divider>

            <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
              Pattern-oriented validation only. Archetype predictions are compared directionally against IFS 2011
              aggregate distributional findings — not against individual ground truth. Simulation output
              represents modelled reasoning, not primary polling data.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
