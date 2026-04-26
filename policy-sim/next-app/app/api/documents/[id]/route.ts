import { type NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await proxyFetch(`/api/documents/${encodeURIComponent(id)}`)
  return Response.json(await res.json())
}
