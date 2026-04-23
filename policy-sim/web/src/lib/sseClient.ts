// Native EventSource SSE client — no buffering issues, browser-native streaming
// API key passed as ?key= query param since EventSource cannot set custom headers

import type { RunEvent } from "./events"

const API_KEY = import.meta.env.VITE_POLICY_SIM_KEY ?? ""

function sseUrl(path: string): string {
  if (!API_KEY) return path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}key=${encodeURIComponent(API_KEY)}`
}

function parseData(eventType: string, data: string): RunEvent | null {
  if (!data) return null
  try {
    const payload = JSON.parse(data)
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
  const basePath = replay
    ? `/api/runs/${runId}/replay?delay_ms=${delayMs}`
    : `/api/runs/${runId}/stream`

  const url = sseUrl(basePath)

  yield* openEventSource(url, signal)
}

function openEventSource(url: string, signal?: AbortSignal): AsyncGenerator<RunEvent> {
  // Wrap EventSource in an async generator via a queue
  type QueueItem = RunEvent | Error | null
  const queue: QueueItem[] = []
  let resolve: (() => void) | null = null
  const notify = () => { if (resolve) { resolve(); resolve = null } }

  const es = new EventSource(url)

  const eventTypes = [
    "run_started", "supervisor_text", "supervisor_done",
    "thinking", "reaction_delta", "reaction_complete",
    "audio_ready", "brief_text", "brief_done", "validation", "done", "error",
  ]

  for (const eventType of eventTypes) {
    es.addEventListener(eventType, (e: Event) => {
      const me = e as MessageEvent
      const event = parseData(eventType, me.data)
      if (event) { queue.push(event); notify() }
    })
  }

  es.onerror = () => {
    queue.push(new Error("EventSource connection error"))
    notify()
    es.close()
  }

  if (signal) {
    signal.addEventListener("abort", () => { es.close(); queue.push(null); notify() })
  }

  async function* gen(): AsyncGenerator<RunEvent> {
    try {
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((r) => { resolve = r })
        }
        while (queue.length > 0) {
          const item = queue.shift()!
          if (item === null) return
          if (item instanceof Error) throw item
          if (item.type === "done") { yield item; es.close(); return }
          yield item
        }
      }
    } finally {
      es.close()
    }
  }

  return gen()
}
