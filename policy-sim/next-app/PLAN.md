# Next.js Migration Plan — policy-sim/next-app

## Context

`policy-sim/web` (Vite 8 + React 18) is being re-implemented as a Next.js 16 + shadcn/ui v4 app in `policy-sim/next-app/`. Backend (`policy-sim/api` FastAPI) is **unchanged** — Next.js proxies `/api/*` to port 8000.

**Key directive:** We won't carry UI dependencies until absolutely needed. Blocks are the kind of thing we build ourselves using the shadcn primitives already installed — no Tremor, no `@base-ui/react`, no extra chart libs unless explicitly required.

**Outcome:** A clean `policy-sim/next-app/` with migrated components. `policy-sim/web/` stays intact on `main` until the new app is verified.

---

## Responsibility Split

| Who | What |
|-----|------|
| **User** | Bootstrap Next.js, install shadcn blocks |
| **Me** | Migrate all components, hooks, lib, configure Tailwind v4, wire SSE |

---

## Scope

- [ ] Configure proxy rewrites to backend on port 8000 (me)
- [ ] Configure Tailwind v4 (@theme in globals.css) (me)
- [ ] Migrate SSE client — `src/lib/sseClient.ts` copy-as-is (me)
- [ ] Migrate API client — `src/lib/api.ts` (VITE_* → NEXT_PUBLIC_*) (me)
- [ ] Migrate hooks — `src/hooks/useRunStream.ts` (me)
- [ ] Migrate types — `src/lib/events.ts` (me)
- [ ] Migrate utils — `src/lib/utils.ts` (cx/cn/focusRing) (me)
- [ ] Migrate chart utils — `src/lib/chartUtils.ts` (me)
- [ ] Create API route for DEMO_RUN_ID (server-side .env.local) (me)
- [ ] Build App Router pages and layout (me)
- [ ] Migrate all components from `policy-sim/web/src/` (me)
- [ ] Verify build and dev server (both)

---

## Design Directives

- **No extra UI deps** — only what shadcn provides + Next.js native APIs
- **No Tremor** — build charts ourselves or use shadcn `chart.tsx` + recharts if needed
- **No `@base-ui/react`** — shadcn primitives already cover Button/Input/Select/Slider
- **Icons**: Tabler (comes with shadcn v4) — no remixicon to migrate
- **Fonts**: next/font/google (Figtree + Merriweather + Geist Mono already configured)
- **Auth key**: `NEXT_PUBLIC_POLICY_SIM_KEY` env var + `?key=` query param pattern
- **DEMO_RUN_ID**: server-side only via `.env.local` + `/api/config` route

---

## Critical Files (read-only reference)

| File | Purpose |
|------|---------|
| `policy-sim/web/src/App.tsx` | Root component, Sidebar routing |
| `policy-sim/web/src/pages/DashboardPage.tsx` | KPI dashboard |
| `policy-sim/web/src/pages/ComparePage.tsx` | Compare runs + live simulation |
| `policy-sim/web/src/components/Sidebar.tsx` | Layout shell |
| `policy-sim/web/src/components/PolicyInput.tsx` | Sticky header, scenario dropdown |
| `policy-sim/web/src/components/ArchetypeCard.tsx` | Persona cards with streaming thinking |
| `policy-sim/web/src/components/BriefDisplay.tsx` | Markdown brief + stance chart |
| `policy-sim/web/src/components/ValidationPanel.tsx` | IFS validation |
| `policy-sim/web/src/components/ui/` | All primitive components |
| `policy-sim/web/src/lib/sseClient.ts` | **Reuse as-is** — native EventSource |
| `policy-sim/web/src/hooks/useRunStream.ts` | SSE reducer hook |
| `policy-sim/web/tailwind.config.js` | Reference for Tailwind v4 tokens |
| `policy-sim/api/main.py` | Backend routes (unchanged) |

---

## Implementation Steps

### 1. Proxy to backend

In `next.config.mjs`:
```js
const nextConfig = {
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    }]
  },
}
export default nextConfig
```

### 2. Tailwind v4 config

Tailwind v4 has no `tailwind.config.ts` — all customization via `@theme {}` in `app/globals.css`. Copy tokens from `policy-sim/web/tailwind.config.js`:
- Dark mode via `next-themes` `attribute="class"` (no tailwind config change needed)
- Custom fonts already set via `next/font/google` in layout.tsx
- Keyframe animations → `@keyframes` in globals.css

### 3. Core lib files (copy as-is)

```
src/lib/sseClient.ts    — native EventSource, no framework dep
src/lib/events.ts      — typed SSE event union
src/lib/chartUtils.ts  — color utilities
src/hooks/useRunStream.ts
```

### 4. Adapt api.ts

- `VITE_POLICY_SIM_KEY` → `NEXT_PUBLIC_POLICY_SIM_KEY`
- `import.meta.env.*` → `process.env.NEXT_PUBLIC_*` (prefix required for browser-accessible vars)

### 5. API route for DEMO_RUN_ID

`src/app/api/config/route.ts` — reads `process.env.DEMO_RUN_ID`, returns `{ demoRunId }`.

### 6. App Router pages

```
src/app/
  layout.tsx           # RootLayout (ThemeProvider already there)
  page.tsx            # Redirect to /simulation
  simulation/
    page.tsx          # SimulationView
  compare/
    page.tsx          # ComparePage
  dashboard/
    page.tsx          # DashboardPage
  api/config/route.ts # DEMO_RUN_ID endpoint
```

### 7. Build components

| Component | Strategy |
|-----------|----------|
| Sidebar | shadcn `sheet.tsx` for mobile drawer, remixicon → Tabler icons |
| PolicyInput | shadcn `input`, `select`, `button` |
| ArchetypeCard | shadcn `card`, custom streaming panel |
| BriefDisplay | shadcn `card`, `react-markdown`, custom stance bars |
| ValidationPanel | shadcn `badge`, `separator`, custom callout |
| StanceChart | shadcn `chart.tsx` + recharts or custom SVG bars |
| MetricCard | shadcn `card`, custom ProgressCircle component |
| DashboardPage | shadcn `card`, chart components |

### 8. .env.local template

```
DEMO_RUN_ID=<run-id-from-azure>
```

User fills in real run ID. PolicyInput fetches `/api/config` to get it.

---

## Verification

1. `bun run build` — zero errors
2. `bun run dev` — starts on port 3000
3. SSE stream — supervisor text + archetype thinking + brief render
4. Compare page — stance chart + brief markdown
5. Dashboard — KPI cards render
6. Dark mode toggle — no flash
7. Mobile sidebar — drawer opens/closes

---

## Directives

- **No emojis** in code or docs
- **No attribution comments** on commits
- **No `StrictMode`** — avoids double SSE connections
- **`simulation_runs/`** is gitignored — never commit run artifacts
- **Use `bun`** for all JS package management
