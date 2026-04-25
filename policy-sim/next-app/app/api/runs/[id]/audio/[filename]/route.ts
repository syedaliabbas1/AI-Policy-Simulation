import { NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params
  const res = await proxyFetch(`/api/runs/${id}/audio/${filename}`)

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
