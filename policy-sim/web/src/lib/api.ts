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

export interface Policy {
  id: string
  label: string
  scenario_path: string
  description: string
  archetype_ids: string[]
}

export interface CompareRun {
  run_id: string
  policy_label: string
  archetype_scores: Record<string, { score: number; name: string }>
}

export interface CompareBrief {
  run_id: string
  policy_label: string
  markdown: string
}

export async function listScenarios(): Promise<Scenario[]> {
  return apiFetch<Scenario[]>("/api/scenarios")
}

export async function listPolicies(): Promise<Policy[]> {
  return apiFetch<Policy[]>("/api/policies")
}

export async function compareRuns(runIds: string[]): Promise<{ runs: CompareRun[] }> {
  return apiFetch<{ runs: CompareRun[] }>(`/api/runs/compare?runs=${runIds.join(",")}`)
}

export async function compareBriefs(runIds: string[]): Promise<{ briefs: CompareBrief[] }> {
  return apiFetch<{ briefs: CompareBrief[] }>(`/api/runs/compare/briefs?runs=${runIds.join(",")}`)
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

// For resources loaded via browser tags (audio, img) that can't set custom headers —
// append the key as a query param so the auth middleware accepts it.
export function authUrl(path: string): string {
  if (!API_KEY) return path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}key=${encodeURIComponent(API_KEY)}`
}
