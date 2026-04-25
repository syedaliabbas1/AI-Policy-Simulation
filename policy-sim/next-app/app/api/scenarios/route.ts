import { proxyFetch } from "@/lib/proxy"

export async function GET() {
  const res = await proxyFetch("/api/scenarios")
  return Response.json(await res.json())
}
