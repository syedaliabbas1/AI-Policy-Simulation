const KEY = process.env.AZURE_POLICY_SIM_KEY ?? ""
const API_URL = process.env.AZURE_API_URL ?? ""

export async function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-POLICY-SIM-KEY": KEY,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let message = `Upstream error: ${res.status}`
    try {
      const body = await res.json()
      message = (body?.error ?? body?.message ?? message) as string
    } catch {
      const text = await res.text().catch(() => "")
      if (text) message = text.slice(0, 200)
    }
    return Response.json({ error: message }, { status: res.status })
  }
  return res
}
