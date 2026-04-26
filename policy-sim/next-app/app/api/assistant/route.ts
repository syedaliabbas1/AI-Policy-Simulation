import { type NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await proxyFetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return Response.json(await res.json())
}
