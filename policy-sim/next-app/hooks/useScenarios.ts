"use client"

import { useState, useEffect } from "react"

export interface Scenario {
  name: string
  path: string
  label: string
  policy_id: string
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/scenarios")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          const arr = Array.isArray(data.scenarios) ? data.scenarios
                    : Array.isArray(data) ? data
                    : []
          setScenarios(arr)
          if (arr.length === 0 && data.error) setError(data.error as string)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load scenarios"
          )
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { scenarios, loading, error }
}
