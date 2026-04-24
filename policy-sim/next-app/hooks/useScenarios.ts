"use client"

import { useState, useEffect } from "react"
import { API_BASE } from "@/lib/api"

export interface Scenario {
  name: string
  path: string
  label: string
  policy_id: string
}

function authUrl(path: string): string {
  const key = process.env.POLICY_SIM_KEY ?? ""
  return key ? `${API_BASE}${path}?key=${key}` : `${API_BASE}${path}`
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(authUrl("/api/scenarios"))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setScenarios(data.scenarios ?? data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load scenarios")
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { scenarios, loading, error }
}
