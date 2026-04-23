// Typed discriminated union matching the SSE event schema in api/stream.py

export interface Briefing {
  archetype_id: string
  headline: string
  key_points: string[]
  personal_relevance: string
}

export interface Reaction {
  immediate_impact: string
  household_response: string
  concerns: string[]
  support_or_oppose: number // -1.0 to +1.0
  rationale: string
}

export interface ValidationResult {
  directional?: Record<string, { pass: boolean; reason?: string }>
  internal_consistency?: Record<string, boolean>
  counter_scenario?: Record<string, boolean>
  error?: string
  [key: string]: unknown
}

export type RunEvent =
  | { type: "run_started"; run_id: string; scenario_path: string; archetype_ids: string[]; replay?: boolean }
  | { type: "supervisor_text"; token: string }
  | { type: "supervisor_done"; briefings: Record<string, Briefing> }
  | { type: "thinking"; archetype_id: string; token: string }
  | { type: "reaction_delta"; archetype_id: string; token: string }
  | { type: "reaction_complete"; archetype_id: string; reaction: Reaction }
  | { type: "brief_text"; token: string }
  | { type: "brief_done"; markdown: string }
  | { type: "validation"; result: ValidationResult }
  | { type: "done" }
  | { type: "error"; phase: string; message: string }
