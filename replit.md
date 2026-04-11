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

**Architecture:**
- DB version 3 with `accounts` and `transactions` stores alongside legacy `expenses`
- V2→V3 migration: adds `remainingAmount`, `status`, `history` to debt transactions
- `migrateIfNeeded()` runs on every app init (idempotent) and via "Update App" button
- All money flows through accounts (cash/bank/savings) with balance tracking
- FAB (bottom-right fixed button) is the primary entry point for all money actions
- Legacy `expenses` store preserved for backward compat; new entries also write to `transactions`

**Debt Lifecycle:**
- New debts saved with `remainingAmount = amount`, `status = 'active'`, `history = []`
- `DebtDetailSheet` modal: shows progress bar (paid/remaining), payment history, Pay Full / Pay Partial buttons
- Pay Full/Partial: always adjusts account balance (even for old debts), records payment with `accountId` in `history[]`
- `EditDebtModal`: reverses full original amount + each payment from its stored account, applies new, resets history if payments exist
- All transaction deletions (expense/income/transfer/debt) show `ConfirmDeleteModal` before proceeding
- Deletion pushes to undo stack (5-item limit, 5s TTL); undo re-inserts original records via `db.put` + `refresh()`
- Debt deletion: reverses creation impact (full amount, not remaining) + each payment from its stored account; old debts skip creation reversal but still reverse payments
- `DebtPayment` stores `accountId` for correct per-payment balance reversal on delete/edit
- Account deletion safety: blocks if last account or if account has linked transactions

**Screens:**
1. **Home** – Monthly summary, budget progress, top categories, recent expenses
2. **Add Expense** – Custom numpad, category + account picker, date, note, one-tap save
3. **Insights** – Pie chart + bar chart, weekly/monthly toggle, highlights
4. **History** – Date-grouped transactions + separate Debts section; filter pills; edit buttons for income/transfer; debt rows tap to open DebtDetailSheet
5. **Settings** – Budget, accounts manager, category manager, CSV export, Update App, reset all data

**Entry Modals (via FAB):**
- **Expense** → navigates to /add page
- **Income** – IncomeModal: numpad, account picker, note, date → increases balance
- **Transfer** – TransferModal: numpad, from/to account pickers → moves balance
- **Debt** – DebtModal: Borrowed/Lent toggle, numpad, account, note, date, isOld toggle

**Edit Modals:**
- **EditIncomeModal** – Pre-populated income form; reverses old balance, applies new
- **EditTransferModal** – Pre-populated transfer form; uses delta-map for correct multi-account adjustments
- **EditDebtModal** – Pre-populated debt form; warns about payment history reset; reverses/applies via delta-map
- **DebtDetailSheet** – Opens from debt row in History; shows details + payment history + pay actions

**Shared Utilities (from Task #2 refactor):**
- `src/utils/constants.ts` – `ACCOUNT_TYPE_ICONS`, `NUMPAD_KEYS` (shared across all modals/pages)
- `src/utils/dateFilters.ts` – `filterByMonth`, `filterByThisWeek`, `filterByLastWeek` (used by Home, Insights)
- `src/components/Numpad.tsx` – `Numpad` component + `useNumpadInput` hook (used by AddExpense, IncomeModal, TransferModal, DebtModal, DebtDetailSheet)
- `src/components/TransactionDisplay.tsx` – `TxIcon`, `TxAmount`, `getTxLabel`, `getTxAmountInfo` (used by Home, History)

**Stability & Hardening (Task #3):**
- `src/components/ErrorBoundary.tsx` – React class error boundary wrapping the entire app; shows recovery UI on crash instead of white screen
- `AppContext.loadAll` uses a `loadIdRef` stale-request guard so concurrent refreshes don't overwrite each other
- `History.executeDeleteById` uses a `deletingRef` synchronous lock to prevent concurrent deletes
- `UndoContext.handleUndo` uses a `undoingRef` synchronous lock (plus state-based disabled UI) to prevent double-undo on rapid taps
- Delete + undo paths use `atomicBatch()` for all coupled IDB writes (transaction delete + expense delete + account balance updates) — prevents partial state on failure
- `atomicBatch` in `db.ts` wraps multiple store operations in a single IndexedDB transaction with automatic rollback
- Modal component has `closingRef` synchronous lock to prevent double-close, Escape key to dismiss, and pointer-event isolation on card
- Undo callbacks wrap DB restoration in try/finally to always call `refresh()` even on failure
- Main content area uses `calc(96px + env(safe-area-inset-bottom))` for bottom padding to handle notched devices

**Key files:**
- `src/database/` – IndexedDB layer (db.ts v3, accounts.ts, transactions.ts, expenses.ts, categories.ts, settings.ts)
- `src/context/AppContext.tsx` – Global state provider; calls `migrateIfNeeded` on init; stale-load guard
- `src/pages/` – 5 screens
- `src/components/` – BottomNav, FAB, Modal, ConfirmDeleteModal, AccountSheet, AccountFormModal, IncomeModal, TransferModal, DebtModal, EditIncomeModal, EditTransferModal, EditDebtModal, DebtDetailSheet, CategoryIcon, InstallPrompt, Numpad, TransactionDisplay, ErrorBoundary
- `src/context/UndoContext.tsx` – Undo stack (5 items, 5s TTL) with toast UI; `pushUndo(label, asyncFn)` for ephemeral undo; ref-based rapid-tap guard
- `vite.config.ts` – PWA configuration with Workbox

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/expense-tracker run dev` — run expense tracker

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
