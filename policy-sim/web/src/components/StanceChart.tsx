interface ScoreEntry {
  score: number
  name: string
}

interface Props {
  scores: Record<string, ScoreEntry>
}

export function StanceChart({ scores }: Props) {
  const entries = Object.entries(scores)

  return (
    <div className="space-y-3">
      {entries.map(([id, { score, name }]) => {
        const pct = ((score + 1) / 2) * 100
        const isSupport = score > 0.1
        const isOppose = score < -0.1
        const color = isSupport ? "#16a34a" : isOppose ? "#dc2626" : "#94a3b8"

        return (
          <div key={id} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color }}
              >
                {score > 0 ? "+" : ""}{score.toFixed(2)}
              </span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="absolute top-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: color,
                  boxShadow: `0 0 4px ${color}40`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
