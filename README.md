# MozudKhata — Client (Frontend SPA)

Single-page app for MozudKhata (inventory & stock management). Vite + React + TypeScript + Tailwind + shadcn/ui.

> This is one of two repositories. The backend API lives in `../server`. Shared, governing docs live in the root workspace: [`../PROJECT.md`](../PROJECT.md), [`../AGENTS.md`](../AGENTS.md), [`../docs/`](../docs) (see especially `architecture.md`, `api.md`, `security.md`).

## Requirements

- Node.js ≥ 20 (v22 recommended)
- npm
- The backend API running (see `../server`) for anything beyond the static shell

## Setup

```bash
npm install
cp .env.example .env   # defaults work for local dev
npm run dev            # start Vite on http://localhost:5173
```

`VITE_API_URL` (see [`.env.example`](./.env.example)) is the API base path — it defaults to the relative `/api/v1`, which the Vite dev proxy forwards to the backend (set `VITE_DEV_API_PROXY` to point at it, default `http://localhost:4000`). Set an absolute URL for deployed environments. Requests are sent with `credentials: "include"`; state-changing requests carry the double-submit CSRF header automatically.

## Scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server (hot reload).          |
| `npm run build`     | Type-check + build the production bundle.        |
| `npm run preview`   | Preview the production build locally.            |
| `npm run typecheck` | TypeScript type-check only.                      |
| `npm run lint`      | ESLint.                                          |
| `npm test`          | Run Vitest + Testing Library.                    |
| `npm run e2e`       | Run Playwright e2e tests (needs live servers).   |

## Architecture

Feature-first modules under `src/features/<feature>/` (`auth`, `inventory`), each with its own `types.ts`, Zod `schema.ts`, typed `api.ts`, and TanStack Query `hooks.ts`. All server communication goes through the typed API client (`src/lib/api.ts`), which unwraps the `{ data }` envelope, surfaces errors as `ApiError`, and manages the CSRF token. Server state lives in TanStack Query; forms use React Hook Form + Zod. Routing and pages are in `src/pages/` wired through `src/App.tsx` (`RequireAuth` / `RedirectIfAuthed` guards).

**UI is built with shadcn/ui (mandatory — ADR-006):** primitives are added via the CLI (`npx shadcn@latest add <name>`) into `src/components/ui/` and composed into feature UI; styling stays on the Tailwind token theme via the `cn` helper. Pinned to React 18 / Vite 5 / Tailwind 3 (ADR-017).

## Features

- **Auth:** register, login, logout, profile update, password change; session-aware routing.
- **Inventory:** category management (add/rename/archive/restore); product create/edit/archive with server-derived stock status (in stock / low / out); paginated product list with **search (name/SKU), category filter, stock-status filter, and sorting**; product detail.
- **Stock:** record IN / OUT / ADJUSTMENT / DAMAGED_LOST movements with reason capture and an advisory over-draw guardrail (the server's `409` is authoritative); per-product movement history.
- **Dashboard:** at-a-glance overview — stat cards (products, stock units, low/out-of-stock, categories) and a recent-activity feed, with get-started and empty states.
- **History:** global movement history across all products — filter by product, movement type, and date range; paginated shadcn table (product link, type badge, signed delta, balance, reason, timestamp).

## Status

**Phase 10 — Deployment prep done; live deploy owner-gated.** All UI features through Phase 09 are implemented against the API contract (auth UI, inventory UI, stock movement form + history, product-list search/filter/sort, the dashboard, the global history page; Phase 09 `vercel.json` security headers per ADR-026). Phase 10 prepared deployment: `vercel.json` now also carries an SPA `rewrites` rule so deep links (`/history`, `/products/:id`, …) resolve on direct load/refresh, and [`../docs/deployment.md`](../docs/deployment.md) documents the Vercel settings (framework/build/output/root), `VITE_API_URL`, and the CSP `connect-src` tightening to do at deploy. The Phase 11 accessibility pass (field↔error `aria-describedby` linkage, `role="status"`/`role="alert"` live regions, skip-to-content link + focusable `<main>`, `scope="col"` headers) added `a11y.test.tsx`; **33 tests** pass; typecheck / lint / build green. Provisioning the Vercel project and the live deploy are owner actions. See [../PROJECT_STATE.md](../PROJECT_STATE.md) for the live snapshot.
