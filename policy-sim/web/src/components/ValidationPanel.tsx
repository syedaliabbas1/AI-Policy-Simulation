import type { ValidationResult } from "@/lib/events"

interface Props {
  validation: ValidationResult | null
}

function Stamp({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium"
      style={{
        borderColor: pass ? "var(--ps-support)" : "var(--ps-oppose)",
        color: pass ? "var(--ps-support)" : "var(--ps-oppose)",
        background: pass ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
      }}
    >
      <span>{pass ? "✓" : "✗"}</span>
      <span className="uppercase tracking-wide" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
        {label}
      </span>
    </div>
  )
}

export function ValidationPanel({ validation }: Props) {
  if (!validation) return null

  const dir = validation.directional as Record<string, { pass: boolean }> | undefined
  const ic = validation.internal_consistency as Record<string, boolean> | undefined
  const allDirectional = dir ? Object.values(dir).every((v) => v.pass) : false
  const hasError = !!validation.error

  return (
    <section className="border-t border-ps" style={{ background: "var(--ps-surface)" }}>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-0.5 h-6 rounded-full" style={{ background: "var(--ps-gold)" }} />
          <span className="text-xs font-semibold text-ps-heading">IFS Validation</span>
          <span className="label-caps text-ps-muted">2011 Distributional Study · Directional Comparison</span>
        </div>

        {hasError ? (
          <p className="text-xs text-oppose">{validation.error as string}</p>
        ) : (
          <div className="space-y-4">
            {/* Directional checks */}
            {dir && (
              <div>
                <span className="label-caps block mb-2">Directional alignment (archetype vs IFS)</span>
                <div className="flex flex-wrap gap-2">
                  <Stamp pass={allDirectional} label="Overall Directional" />
                  {Object.entries(dir).map(([id, result]) => (
                    <Stamp
                      key={id}
                      pass={result.pass}
                      label={id.replace(/_/g, " ")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Internal consistency */}
            {ic && (
              <div>
                <span className="label-caps block mb-2">Internal consistency checks</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ic).map(([check, pass]) => (
                    <Stamp
                      key={check}
                      pass={pass}
                      label={check.replace(/_/g, " ")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-ps-faint leading-relaxed pt-2 border-t border-ps">
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
