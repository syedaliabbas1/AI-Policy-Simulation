import type { ValidationResult } from "@/lib/events"

interface Props {
  validation: ValidationResult | null
}

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: pass ? "#f0fdf4" : "#fef2f2",
        color:      pass ? "#15803d" : "#b91c1c",
        border:     `1px solid ${pass ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      <span className="text-base leading-none" style={{ fontSize: "0.65rem" }}>{pass ? "✓" : "✗"}</span>
      <span className="uppercase tracking-wide" style={{ letterSpacing: "0.07em", fontSize: "0.6rem" }}>
        {label}
      </span>
    </span>
  )
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
          <p className="text-xs text-red-600">{validation.error as string}</p>
        ) : (
          <div className="space-y-5">
            {dir && (
              <div className="bg-slate-50 rounded-lg p-4 border border-ps">
                <span className="label-caps block mb-3">Directional alignment — archetype vs IFS findings</span>
                <div className="flex flex-wrap gap-2">
                  <Badge pass={allDirectional} label="Overall directional" />
                  {Object.entries(dir).map(([id, result]) => (
                    <Badge key={id} pass={result.pass} label={id.replace(/_/g, " ")} />
                  ))}
                </div>
              </div>
            )}

            {ic && (
              <div className="bg-slate-50 rounded-lg p-4 border border-ps">
                <span className="label-caps block mb-3">Internal consistency checks</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ic).map(([check, pass]) => (
                    <Badge key={check} pass={pass} label={check.replace(/_/g, " ")} />
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
