import type {
  CreateRunResponse,
  CompareResponse,
  CompareBriefsResponse,
  ValidationResult,
} from "./types"

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function createRun(scenario_path: string): Promise<CreateRunResponse> {
  return post<CreateRunResponse>("/api/runs", { scenario_path })
}

export async function getBrief(runId: string): Promise<{ markdown: string }> {
  return get<{ markdown: string }>(`/api/runs/${runId}/brief`)
}

export async function getValidation(runId: string): Promise<ValidationResult> {
  return get<ValidationResult>(`/api/runs/${runId}/validation`)
}

export async function compareRuns(runIds: string[]): Promise<CompareResponse> {
  return get<CompareResponse>(`/api/runs/compare?runs=${runIds.join(",")}`)
}

export async function listRuns(): Promise<{ runs: Array<{ run_id: string; status: string; created_at: string; scenario_path: string }> }> {
  return get<{ runs: Array<{ run_id: string; status: string; created_at: string; scenario_path: string }> }>("/api/runs")
}

export async function compareBriefs(runIds: string[]): Promise<CompareBriefsResponse> {
  return get<CompareBriefsResponse>(`/api/runs/compare/briefs?runs=${runIds.join(",")}`)
}

export function getReplayUrl(runId: string, delayMs = 30): string {
  return `/api/runs/${runId}/replay?delay_ms=${delayMs}`
}

export async function listDocuments(): Promise<{ documents: Array<{ id: string; title: string; filename: string; size: number }> }> {
  return get("/api/documents")
}

export async function getDocument(id: string): Promise<{ id: string; title: string; content: string }> {
  return get(`/api/documents/${encodeURIComponent(id)}`)
}

export async function sendAssistantMessage(
  messages: Array<{ role: string; content: string }>,
  runId?: string
): Promise<{ content: string }> {
  return post("/api/assistant", { messages, run_id: runId ?? null })
}

export async function checkHealth(): Promise<{ status: string }> {
  return get("/api/health")
}
