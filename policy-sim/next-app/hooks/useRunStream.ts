"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { API_BASE } from "@/lib/api"
import type {
  RunStarted,
  SupervisorText,
  Thinking,
  ReactionDelta,
  ReactionComplete,
  BriefText,
  BriefDone,
  ValidationResult,
  ValidationWarning,
  ArchetypeStreamState,
} from "@/lib/types"

export interface RunStreamHandlers {
  onRunStarted?: (data: RunStarted) => void
  onSupervisorText?: (data: SupervisorText) => void
  onThinking?: (data: Thinking) => void
  onReactionDelta?: (data: ReactionDelta) => void
  onReactionComplete?: (data: ReactionComplete) => void
  onBriefText?: (data: BriefText) => void
  onBriefDone?: (data: BriefDone) => void
  onValidation?: (data: ValidationResult) => void
  onValidationWarning?: (data: ValidationWarning) => void
  onDone?: () => void
  onError?: (error: Event) => void
}

function authUrl(path: string): string {
  const key = process.env.POLICY_SIM_KEY ?? ""
  return key ? `${API_BASE}${path}?key=${key}` : `${API_BASE}${path}`
}

export function useRunStream(
  runId: string | null,
  handlers: RunStreamHandlers,
  mode: "live" | "replay" = "live"
) {
  const esRef = useRef<EventSource | null>(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const disconnect = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!runId) return
    disconnect()

    const endpoint = mode === "replay" ? `/api/runs/${runId}/replay` : `/api/runs/${runId}/stream`
    const url = authUrl(endpoint)
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)

    // EventSource dispatches named events via addEventListener
    // The SSE format is: event:<name>\ndata:<json>\n\n
    es.addEventListener("run_started", (e) => {
      handlersRef.current.onRunStarted?.(JSON.parse(e.data))
    })

    es.addEventListener("supervisor_text", (e) => {
      handlersRef.current.onSupervisorText?.(JSON.parse(e.data))
    })

    es.addEventListener("thinking", (e) => {
      handlersRef.current.onThinking?.(JSON.parse(e.data))
    })

    es.addEventListener("reaction_delta", (e) => {
      handlersRef.current.onReactionDelta?.(JSON.parse(e.data))
    })

    es.addEventListener("reaction_complete", (e) => {
      handlersRef.current.onReactionComplete?.(JSON.parse(e.data))
    })

    es.addEventListener("brief_text", (e) => {
      handlersRef.current.onBriefText?.(JSON.parse(e.data))
    })

    es.addEventListener("brief_done", (e) => {
      handlersRef.current.onBriefDone?.(JSON.parse(e.data))
    })

    es.addEventListener("validation", (e) => {
      handlersRef.current.onValidation?.(JSON.parse(e.data))
    })

    es.addEventListener("validation_warning", (e) => {
      handlersRef.current.onValidationWarning?.(JSON.parse(e.data))
    })

    es.addEventListener("done", () => {
      handlersRef.current.onDone?.()
      disconnect()
    })

    es.onerror = (e) => {
      handlersRef.current.onError?.(e)
      disconnect()
    }
  }, [runId, mode, disconnect])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { connected, reconnect: connect, disconnect }
}
