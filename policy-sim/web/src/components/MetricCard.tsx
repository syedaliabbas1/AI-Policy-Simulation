// Tremor MetricCard — dashboard KPI card [v0.0.1]

import React from "react"

import { cx } from "@/lib/utils"

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string
  change?: number
  changeLabel?: string
  visualization?: React.ReactNode
  badgeVariant?: "default" | "neutral" | "success" | "error" | "warning"
}

const badgeStyles: Record<string, string> = {
  default: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400",
  neutral: "bg-gray-50 text-gray-700 dark:bg-gray-400/10 dark:text-gray-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400",
  error: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400",
  warning: "bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-400",
}

function getChangeVariant(change: number): "success" | "error" | "neutral" {
  if (change > 0) return "success"
  if (change < 0) return "error"
  return "neutral"
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, change, changeLabel, visualization, badgeVariant, className, ...props }, forwardedRef) => {
    const variant = badgeVariant ?? (change !== undefined ? getChangeVariant(change) : "neutral")
    const badge = badgeStyles[variant]

    return (
      <div
        ref={forwardedRef}
        className={cx(
          "rounded-lg border p-6 text-left shadow-xs",
          "bg-white dark:bg-[#090E1A]",
          "border-gray-200 dark:border-gray-900",
          className,
        )}
        tremor-id="tremor-raw"
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {change !== undefined && (
            <span
              className={cx(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10",
                badge,
              )}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
              {changeLabel && <span className="ml-1 opacity-70">{changeLabel}</span>}
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
          {value}
        </p>
        {visualization && (
          <div className="mt-4">{visualization}</div>
        )}
      </div>
    )
  },
)

MetricCard.displayName = "MetricCard"

export { MetricCard, type MetricCardProps }