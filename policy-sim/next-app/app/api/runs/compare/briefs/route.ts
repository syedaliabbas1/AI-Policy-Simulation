import { NextRequest } from "next/server"
import { proxyFetch } from "@/lib/proxy"

export async function GET(request: NextRequest) {
  const runs = request.nextUrl.searchParams.get("runs")
  const res = await proxyFetch(`/api/runs/compare/briefs?runs=${runs}`)
  return Response.json(await res.json())
}
