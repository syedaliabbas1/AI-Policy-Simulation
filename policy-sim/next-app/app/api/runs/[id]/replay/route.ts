import { NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const path = `/api/runs/${id}/replay${searchParams ? `?${searchParams}` : ""}`
  const res = await proxyFetch(path)

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
