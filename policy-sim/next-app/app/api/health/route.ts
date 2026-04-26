import { proxyFetch } from "@/lib/proxy"

export async function GET() {
  const res = await proxyFetch("/api/health")
  return Response.json(await res.json())
}
