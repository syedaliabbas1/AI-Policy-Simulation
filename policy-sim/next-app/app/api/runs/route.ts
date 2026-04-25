import { NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET() {
  const res = await proxyFetch("/api/runs")
  return Response.json(await res.json())
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await proxyFetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return Response.json(await res.json())
}
