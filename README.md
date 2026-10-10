# MozudKhata — Client

Frontend for MozudKhata (Cloud POS & Inventory SaaS). **Separate Git repository**
from `backend/`; deployed on **Vercel**.

- **Stack:** Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS ·
  shadcn/ui
- **Design tokens:** come only from [`../docs/UI-UX/`](../docs/UI-UX/). Do not invent
  colors, fonts, spacing, or radii.
- **Data:** the frontend never touches the database. All data flows through the
  backend API. During Stage 1 a swappable mock data-access layer is used (see
  `../docs/implementation_plan.md`).

## Scripts

| Command             | Purpose                                                     |
| :------------------ | :---------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                        |
| `npm run build`     | Production build                                            |
| `npm run start`     | Serve the production build                                  |
| `npm run lint`      | ESLint                                                      |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)                                 |
| `npm run test`      | Unit/component tests (Vitest)                               |
| `npm run test:e2e`  | E2E tests (Playwright — run `npx playwright install` first) |
| `npm run format`    | Prettier write                                              |

## Setup

1. Node 22 (`.nvmrc`). `npm install`.
2. Copy `.env.example` → `.env.local`. Only `NEXT_PUBLIC_*` values — never secrets.
3. `npm run dev`.

## Structure

```text
app/
  (auth)/       # login, signup, forgot/reset password
  (account)/    # verify email, onboarding wizard
  (app)/        # authenticated shell: dashboard, pos, products, inventory, …
components/
  ui/           # shadcn/ui primitives themed to UI-UX tokens
  layout/       # sidebar, header, store switcher, command menu, sync badge
  states/       # loading / error / empty / page-header
features/       # domain modules: auth, onboarding, dashboard, pos, products, catalog
lib/
  data/         # data-access layer: types, repositories (contracts),
                #   provider (swap point), mock/ (Stage 1 adapter + seed)
  format.ts     # money (minor units) / number / date / RTL-aware formatting
```

The UI depends only on the repository **interfaces** in `lib/data/repositories.ts`.
Stage 1 binds them to the mock adapter via `lib/data/provider.ts`; Stage 3 swaps in an
HTTP adapter implementing the same contracts with no UI changes.

## Progress

**Stage 1 (frontend prototype on mock data) is complete and hardened.** All navigation
surfaces are built against the swappable mock data-access layer: app shell + navigation,
auth & onboarding, executive dashboard, high-speed POS terminal, products & catalog
(variant matrix, search/filter/sort, bulk actions, CSV import/export), inventory & stock
(adjustments, transfers, movement ledger), purchases & suppliers, sales & customers,
expenses & reports, and staff/roles/stores/notifications/settings admin.

Phase 11 (polish & hardening, 2026-10-11) closed the Stage 1 gate: WCAG AA accessibility
and contrast (light + dark, axe-verified), keyboard-first POS, consistent
loading/error/empty states and confirmations, and responsive layouts down to 390 px with
an RTL smoke pass. Mock-only actions are labelled as prototype/preview in the UI — a
successful mock checkout is **not** a persisted production sale. Verified with typecheck,
lint, 131 unit/component tests, a clean production build, and a 94-test Playwright suite
(including axe, console-error, responsive, RTL, and POS-keyboard checks). Next is
**Stage 2 (backend)**. See
[`../docs/implementation_plan.md`](../docs/implementation_plan.md) for the full phase plan.

Git is managed by the human developer only.
