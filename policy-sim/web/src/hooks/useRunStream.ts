import { useCallback, useReducer, useRef } from "react"
import type { Briefing, Reaction, ValidationResult } from "@/lib/events"
import { streamRun } from "@/lib/sseClient"
import { createRun } from "@/lib/api"

export type Phase = "idle" | "supervisor" | "reacting" | "reporting" | "done" | "error"

export interface ArchetypeState {
  thinking: string
  reactionTokens: string
  reaction: Reaction | null
  complete: boolean
  audioUrl: string | null
}

export interface RunState {
  phase: Phase
  runId: string | null
  archetypeIds: string[]
  supervisorText: string
  briefings: Record<string, Briefing>
  archetypes: Record<string, ArchetypeState>
  briefMarkdown: string
  validation: ValidationResult | null
  error: string | null
}

const initialState: RunState = {
  phase: "idle",
  runId: null,
  archetypeIds: [],
  supervisorText: "",
  briefings: {},
  archetypes: {},
  briefMarkdown: "",
  validation: null,
  error: null,
}

type Action =
  | { type: "RESET" }
  | { type: "RUN_STARTED"; runId: string; archetypeIds: string[] }
  | { type: "SUPERVISOR_TOKEN"; token: string }
  | { type: "SUPERVISOR_DONE"; briefings: Record<string, Briefing> }
  | { type: "THINKING_TOKEN"; archetypeId: string; token: string }
  | { type: "REACTION_TOKEN"; archetypeId: string; token: string }
  | { type: "REACTION_COMPLETE"; archetypeId: string; reaction: Reaction }
  | { type: "AUDIO_READY"; archetypeId: string; audioUrl: string }
  | { type: "BRIEF_TOKEN"; token: string }
  | { type: "BRIEF_DONE"; markdown: string }
  | { type: "VALIDATION"; result: ValidationResult }
  | { type: "DONE" }
  | { type: "ERROR"; message: string }

function archetypeDefault(): ArchetypeState {
  return { thinking: "", reactionTokens: "", reaction: null, complete: false, audioUrl: null }
}

function reducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case "RESET":
      return { ...initialState }

    case "RUN_STARTED": {
      const archetypes: Record<string, ArchetypeState> = {}
      for (const id of action.archetypeIds) archetypes[id] = archetypeDefault()
      return { ...state, phase: "supervisor", runId: action.runId, archetypeIds: action.archetypeIds, archetypes, supervisorText: "", briefings: {}, briefMarkdown: "", validation: null, error: null }
    }

    case "SUPERVISOR_TOKEN":
      return { ...state, supervisorText: state.supervisorText + action.token }

    case "SUPERVISOR_DONE":
      return { ...state, phase: "reacting", briefings: action.briefings }

    case "THINKING_TOKEN": {
      const prev = state.archetypes[action.archetypeId] ?? archetypeDefault()
      return { ...state, archetypes: { ...state.archetypes, [action.archetypeId]: { ...prev, thinking: prev.thinking + action.token } } }
    }

    case "REACTION_TOKEN": {
      const prev = state.archetypes[action.archetypeId] ?? archetypeDefault()
      return { ...state, archetypes: { ...state.archetypes, [action.archetypeId]: { ...prev, reactionTokens: prev.reactionTokens + action.token } } }
    }

    case "REACTION_COMPLETE": {
      const prev = state.archetypes[action.archetypeId] ?? archetypeDefault()
      return { ...state, archetypes: { ...state.archetypes, [action.archetypeId]: { ...prev, reaction: action.reaction, complete: true } } }
    }

    case "AUDIO_READY": {
      const prev = state.archetypes[action.archetypeId] ?? archetypeDefault()
      return { ...state, archetypes: { ...state.archetypes, [action.archetypeId]: { ...prev, audioUrl: action.audioUrl } } }
    }

    case "BRIEF_TOKEN":
      return { ...state, phase: "reporting", briefMarkdown: state.briefMarkdown + action.token }

    case "BRIEF_DONE":
      return { ...state, briefMarkdown: action.markdown }

    case "VALIDATION":
      return { ...state, validation: action.result }

    case "DONE":
      return { ...state, phase: "done" }

    case "ERROR":
      return { ...state, phase: "error", error: action.message }

    default:
      return state
  }
}

export function useRunStream() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(async (scenarioPath: string, replay = false, replayRunId?: string) => {
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    dispatch({ type: "RESET" })

    try {
      const runId = replay && replayRunId
        ? replayRunId
        : (await createRun(scenarioPath)).run_id

      for await (const event of streamRun(runId, replay, 30, abort.signal)) {
        if (abort.signal.aborted) break

        switch (event.type) {
          case "run_started":
            dispatch({ type: "RUN_STARTED", runId: event.run_id, archetypeIds: event.archetype_ids })
            break
          case "supervisor_text":
            dispatch({ type: "SUPERVISOR_TOKEN", token: event.token })
            break
          case "supervisor_done":
            dispatch({ type: "SUPERVISOR_DONE", briefings: event.briefings })
            break
          case "thinking":
            dispatch({ type: "THINKING_TOKEN", archetypeId: event.archetype_id, token: event.token })
            break
          case "reaction_delta":
            dispatch({ type: "REACTION_TOKEN", archetypeId: event.archetype_id, token: event.token })
            break
          case "reaction_complete":
            dispatch({ type: "REACTION_COMPLETE", archetypeId: event.archetype_id, reaction: event.reaction })
            break
          case "audio_ready": {
            const audioUrl = `/api/runs/${runId}/audio/${event.filename}`
            dispatch({ type: "AUDIO_READY", archetypeId: event.archetype_id, audioUrl })
            break
          }
          case "brief_text":
            dispatch({ type: "BRIEF_TOKEN", token: event.token })
            break
          case "brief_done":
            dispatch({ type: "BRIEF_DONE", markdown: event.markdown })
            break
          case "validation": {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { type: _t, ...validationData } = event
            dispatch({ type: "VALIDATION", result: validationData as ValidationResult })
            break
          }
            break
          case "done":
            dispatch({ type: "DONE" })
            break
          case "error":
            dispatch({ type: "ERROR", message: event.message })
            break
        }
      }
    } catch (err) {
      if (!abort.signal.aborted) {
        dispatch({ type: "ERROR", message: String(err) })
      }
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: "RESET" })
  }, [])

  return { state, start, stop }
}
