import type { ValidationResult } from "@/lib/events"
import { BadgeDelta } from "@tremor/react"

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
    <section className="border-t border-ps bg-white">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 rounded-full bg-amber-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">IFS Validation</h3>
            <p className="text-xs text-slate-400 mt-0.5">2011 Distributional Study — Directional Comparison</p>
          </div>
        </div>

        {hasError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-xs text-rose-700">
            <strong className="font-semibold">Error: </strong>{validation.error as string}
          </div>
        ) : (
          <div className="space-y-5">
            {dir && (
              <div className="bg-slate-50 rounded-lg p-4 border border-ps">
                <span className="label-caps block mb-3">Directional alignment — archetype vs IFS findings</span>
                <div className="flex flex-wrap gap-2">
                  <BadgeDelta
                    isIncreasePositive={allDirectional}
                    deltaType={allDirectional ? "increase" : "decrease"}
                    size="sm"
                  >
                    Overall
                  </BadgeDelta>
                  {Object.entries(dir).map(([id, result]) => (
                    <BadgeDelta
                      key={id}
                      isIncreasePositive={result.pass}
                      deltaType={result.pass ? "increase" : "decrease"}
                      size="sm"
                    >
                      {id.replace(/_/g, " ")}
                    </BadgeDelta>
                  ))}
                </div>
              </div>
            )}

            {ic && (
              <div className="bg-slate-50 rounded-lg p-4 border border-ps">
                <span className="label-caps block mb-3">Internal consistency checks</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ic).map(([check, pass]) => (
                    <BadgeDelta
                      key={check}
                      isIncreasePositive={pass}
                      deltaType={pass ? "increase" : "decrease"}
                      size="sm"
                    >
                      {check.replace(/_/g, " ")}
                    </BadgeDelta>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-ps">
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
