"use client"

import { useState, useEffect } from "react"
import { API_BASE } from "@/lib/api"

export interface CompletedRun {
  run_id: string
  status: string
  created_at: string
  scenario_path: string
  has_full_data?: boolean
}

function authUrl(path: string): string {
  const key = process.env.POLICY_SIM_KEY ?? ""
  return key ? `${API_BASE}${path}?key=${key}` : `${API_BASE}${path}`
}

export function useCompletedRuns() {
  const [runs, setRuns] = useState<CompletedRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(authUrl("/api/runs"))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setRuns(data.runs ?? [])
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load runs")
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { runs, loading, error }
}
