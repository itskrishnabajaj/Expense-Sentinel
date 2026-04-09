# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Expense Tracker PWA (`artifacts/expense-tracker`)

A premium personal expense tracking Progressive Web App (PWA).

- **Stack**: React + Vite, Tailwind CSS, IndexedDB (idb), vite-plugin-pwa
- **Design**: Dark theme only (#0D0D0D background, #1A1A1A cards, indigo accent)
- **Data**: 100% local-first, all data in IndexedDB, no backend
- **PWA**: manifest.json + Workbox service worker, installable on mobile

**Screens:**
1. **Home** – Monthly summary, budget progress, top categories, recent expenses
2. **Add Expense** – Custom numpad, category picker, date, note, one-tap save
3. **Insights** – Pie chart + bar chart, weekly/monthly toggle, highlights
4. **History** – All expenses grouped by date, filter by category, edit/delete
5. **Settings** – Budget, category manager, CSV export, reset all data

**Key files:**
- `src/database/` – IndexedDB layer (expenses, categories, settings)
- `src/context/AppContext.tsx` – Global state provider
- `src/pages/` – All 5 screens
- `src/components/` – BottomNav, BudgetProgress, CategoryIcon, InstallPrompt
- `vite.config.ts` – PWA configuration with Workbox

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/expense-tracker run dev` — run expense tracker

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
