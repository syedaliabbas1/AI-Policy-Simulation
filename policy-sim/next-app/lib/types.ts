// ─── SSE Event Payloads ───────────────────────────────────────────────────────

export interface RunStarted {
  run_id: string
  scenario_path: string
  archetype_ids: string[]
}

export interface SupervisorText {
  token: string
}

export interface Thinking {
  archetype_id: string
  token: string
}

export interface ReactionDelta {
  archetype_id: string
  token: string
}

export interface ArchetypeReaction {
  support_or_oppose: number // -1.0 to 1.0
  display_name: string
  concerns: string[]
  rationale: string
}

export interface ReactionComplete {
  archetype_id: string
  reaction: ArchetypeReaction
}

export interface BriefText {
  token: string
}

export interface BriefDone {
  markdown: string
}

export interface ValidationWarning {
  archetype_id: string
  warning: {
    archetype_id: string
    score: number
    expected_sign: number
    rule: string
  }
}

export interface ValidationCheck {
  pass: boolean
  details?: Record<string, unknown>
  detail?: string
  note?: string
}

export interface ValidationResult {
  run_id: string
  validated_at: string
  overall_pass: boolean
  checks: {
    directional: ValidationCheck
    ordering: ValidationCheck
    concern_rationale_overlap: ValidationCheck
    no_hallucinated_policy: ValidationCheck
  }
}

// ─── REST Response Types ─────────────────────────────────────────────────────

export interface CreateRunResponse {
  run_id: string
}

export interface CompareRun {
  run_id: string
  policy_label: string
  archetype_scores: Record<string, { score: number; name: string }>
}

export interface CompareResponse {
  runs: CompareRun[]
}

export interface CompareBrief {
  run_id: string
  policy_label: string
  markdown: string
}

export interface CompareBriefsResponse {
  briefs: CompareBrief[]
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface ArchetypeStreamState {
  thinkingText: string
  reactionText: string
  isStreaming: boolean
  reactionDone: boolean
  reaction: ArchetypeReaction | null
}

export type RunStatus = "idle" | "running" | "done" | "error"
