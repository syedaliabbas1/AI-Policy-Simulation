// Fetch wrappers — all requests inject the shared-secret header

const API_KEY = import.meta.env.VITE_POLICY_SIM_KEY ?? ""

function headers(extra: HeadersInit = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-POLICY-SIM-KEY": API_KEY } : {}),
    ...extra,
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: headers(init?.headers) })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

export interface Scenario {
  name: string
  path: string
  label: string
}

export async function listScenarios(): Promise<Scenario[]> {
  return apiFetch<Scenario[]>("/api/scenarios")
}

export async function createRun(scenarioPath: string): Promise<{ run_id: string }> {
  return apiFetch<{ run_id: string }>("/api/runs", {
    method: "POST",
    body: JSON.stringify({ scenario_path: scenarioPath }),
  })
}

export async function getBrief(runId: string): Promise<{ markdown: string }> {
  return apiFetch<{ markdown: string }>(`/api/runs/${runId}/brief`)
}
