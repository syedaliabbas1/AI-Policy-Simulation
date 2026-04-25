import { NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await proxyFetch(`/api/runs/${id}/stream`)

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
