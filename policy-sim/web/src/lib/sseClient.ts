// fetch + ReadableStream SSE client — must use fetch (not EventSource) to set custom headers

import type { RunEvent } from "./events"

const API_KEY = import.meta.env.VITE_POLICY_SIM_KEY ?? ""

function authHeaders(): HeadersInit {
  return API_KEY ? { "X-POLICY-SIM-KEY": API_KEY } : {}
}

function parseEvent(block: string): RunEvent | null {
  let eventType = "message"
  let dataLine = ""

  for (const line of block.split("\n")) {
    const trimmedLine = line.replace(/\r$/, "") // strip CRLF
    if (trimmedLine.startsWith("event:")) {
      eventType = trimmedLine.slice(6).trim()
    } else if (trimmedLine.startsWith("data:")) {
      dataLine = trimmedLine.slice(5).trim()
    }
  }

  if (!dataLine) return null

  try {
    const payload = JSON.parse(dataLine)
    return { type: eventType, ...payload } as RunEvent
  } catch {
    return null
  }
}

export async function* streamRun(
  runId: string,
  replay = false,
  delayMs = 30,
  signal?: AbortSignal,
): AsyncGenerator<RunEvent> {
  const url = replay
    ? `/api/runs/${runId}/replay?delay_ms=${delayMs}`
    : `/api/runs/${runId}/stream`

  const res = await fetch(url, {
    headers: { ...authHeaders(), Accept: "text/event-stream" },
    signal,
  })

  if (!res.ok) throw new Error(`SSE ${res.status}: ${await res.text()}`)
  if (!res.body) throw new Error("No response body")

  // Use TextDecoder directly — pipeThrough(TextDecoderStream) can buffer in Chromium
  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE blocks are separated by double newlines
      const blocks = buffer.split("\n\n")
      buffer = blocks.pop() ?? ""

      for (const block of blocks) {
        const trimmed = block.trim()
        if (!trimmed) continue
        const event = parseEvent(trimmed)
        if (event) yield event
      }
    }

    // Flush any remaining data
    const remaining = decoder.decode()
    if (remaining.trim()) {
      const event = parseEvent(remaining.trim())
      if (event) yield event
    }
  } finally {
    reader.releaseLock()
  }
}
