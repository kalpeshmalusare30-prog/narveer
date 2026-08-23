# Universal Mandal CRM — Phase 1 (Foundation & Tenancy)

A universal, multi-organization Membership & Financial CRM for mandals, trusts,
associations, and clubs. This repository contains **Phase 1: the multi-tenant
foundation** — organizations, authentication, role-based access control,
organization setup, configurable settings, member management, and a
cross-cutting audit trail. Later phases (fees, payments, receipts, WhatsApp,
income/expense, dashboard analytics, reports, import/export) build on this base.

Initial tenant: **Narveer Tanaji Malusare Pratishthan, Kharabwadi**.

## Tech stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **PostgreSQL** + **Prisma 6** (shared-schema multi-tenancy)
- **Auth.js v5** (credentials) with **argon2** password hashing
- **next-intl** — bilingual **English + Marathi**
- **Tailwind CSS 4**
- **Vitest** (unit/integration) + **Playwright** (E2E)
- **Docker** for deployment

## What Phase 1 delivers

- Multi-tenant architecture with row-level `organization_id` scoping enforced
  centrally by a Prisma client extension (proven isolated by tests).
- Auth.js login (login-ID **or** email + password), change password, and
  admin-initiated password reset.
- Permission-based RBAC with a granular catalog and five seeded system roles
  (Super Admin, Org Admin, Treasurer, Committee Member, Data Entry Operator).
- Super-admin organization management (create / activate / deactivate).
- Organization setup wizard (details → financial config → comms stub → finish).
- Configurable membership types and member statuses.
- User management with role assignment and password reset.
- Role & permission editor (custom roles; system roles protected).
- Member management: create/edit/void, search + filters, paginated list, and a
  member profile with Personal/Membership tabs (Fees/Payments/Receipts/WhatsApp
  tabs are placeholders for later phases).
- Cross-cutting: audit trail, Zod validation, `Decimal` money handling, soft
  delete/void, bilingual UI with an en/mr toggle, and configurable org branding
  (name + logo stored as data, never hard-coded).

## Prerequisites

- Node.js ≥ 20
- PostgreSQL (via Docker **or** a local install)

## Database setup

### Option A — Docker (recommended for deploy)

```bash
docker compose up -d postgres
# .env DATABASE_URL should point to localhost:5432 (crm/crm/mandal_crm)
```

### Option B — Local PostgreSQL

Create a database and user, then set `DATABASE_URL` / `DATABASE_URL_TEST` in
`.env` / `.env.test` accordingly. (During the autonomous build this project used
a local PostgreSQL 17 cluster on **port 5433**, user `crm`, databases
`mandal_crm` and `mandal_crm_test`.)

## Environment

Copy `.env.example` to `.env` (and `.env.test` for tests) and adjust:

```
DATABASE_URL="postgresql://crm:crm@localhost:5433/mandal_crm?schema=public"
DATABASE_URL_TEST="postgresql://crm:crm@localhost:5433/mandal_crm_test?schema=public"
AUTH_SECRET="<32+ byte random secret>"
AUTH_URL="http://localhost:3000"
STORAGE_LOCAL_DIR="./uploads"
```

## Install, migrate, seed, run

```bash
npm install
npm run db:migrate       # apply migrations to the dev DB (+ generate client)
npm run db:reset:test    # apply migrations to the test DB
npm run seed             # seed permissions, Narveer org + logo, roles, admin
npm run dev              # http://localhost:3000
```

For production:

```bash
npm run build && npm run start
# or: docker compose up   (migrates, seeds, and starts the app)
```

### Seeded logins

| Login        | Password   | Role                       |
| ------------ | ---------- | -------------------------- |
| `admin`      | `admin123` | Org Admin (Narveer org)    |
| `superadmin` | `super123` | Platform Super Admin       |

> Change these before any real deployment.

## Testing

```bash
npm test                 # Vitest unit + integration (42 tests)
npm run e2e:install      # one-time: install the Playwright Chromium browser
npm run e2e              # Playwright end-to-end (11 tests, all modules)
```

Integration and E2E tests run against the test / dev database respectively.

## Project structure

```
prisma/            schema.prisma, seed.ts
messages/          en.json, mr.json  (i18n catalogs)
src/i18n/          next-intl routing, request config, navigation
src/lib/           db (tenant context + scoped client), auth, rbac, audit,
                   money, membercode, storage
src/features/      organizations, setup, settings, users, roles, members
                   (each: actions/query + components)
src/components/    ui primitives, app shell (nav, branding, locale toggle)
src/app/[locale]/  (auth) login/change-password, (app) authenticated pages
e2e/               Playwright specs
docs/superpowers/  design spec + implementation plan
```

## Phase 2 — Core Financial (delivered)

- Financial years (label, fee, auto-derived start/end, activate/close).
- Annual fees: assign to all active members, bulk-select, or manually; fee
  amount **snapshotted** at assignment; year-wise tracking of paid/pending/status
  and historical multi-year dues; waive/exempt/cancel.
- Configurable payment modes.
- Payments with **multi-year allocation** (one payment split across years),
  partial payments, over-allocation prevention, and **void that reverses
  allocations** and restores pending.
- **PDF receipts** (`/receipts/[id]/pdf`) via React-PDF with bundled Noto Sans
  Devanagari — bilingual, downloadable, with per-year allocation lines.
- Pending-dues list, payments list, receipts list.
- Member profile Annual Fees / Payments / Receipts tabs are live.
- Dashboard current-year collection tiles (expected / collected / pending / %).

## Phase 3 — Communication, Money & Reports + UI redesign (delivered)

- Income & Expense management with categories; balance = (membership collection
  + other income) − expenses; dashboard financial summary + quick actions.
- WhatsApp: provider architecture (Meta Cloud API) with an explicit unconfigured
  state, editable templates, reminder/confirmation/receipt/bulk sends, message
  history + delivery/failure status. Configure under Settings → WhatsApp.
- Reports: year-wise collection, payment modes, income/expense by category,
  WhatsApp — with CSV export and print-to-PDF.
- Audit-log viewer (`audit.view`); settings hub; income/expense category config.
- Production UI redesign: icon sidebar (grouped, collapsible/responsive), stat
  cards, refined tables, status badges, empty/loading/error states, redesigned
  dashboard and member profile.
- Security: `/api/files` now requires an authenticated session.

## Data import (delivered)

Excel/CSV import (§30) for **members, historical fees, and historical payments**
with a validate-first **dry-run preview**, per-row duplicate detection and error
reporting, then a commit. Fees import auto-creates the financial year and records
an opening-balance payment so pending stays correct; payments import auto-allocates
oldest-dues-first. Under **Import Data** (permission `data.import`).

## Search, notifications & theme (delivered)

- **Global search** (§27): sidebar search across members (name/code/mobile) and
  receipts, permission‑aware, with a grouped results page.
- **Notifications** (§28): in‑app feed generated on real events (payment
  received, new member, expense recorded, WhatsApp failure) with an unread bell
  badge and mark‑all‑read.
- **Theme:** forced light theme; the accent palette is rebranded to the
  organization logo's vermilion/saffron (single source in `globals.css`).

## Roadmap (remaining)

- WhatsApp delivery-status webhooks (Sent → Delivered → Read) — outbound
  sending is real once credentials are configured; inbound status callbacks are
  not wired yet.
- Real-time push for notifications (currently refreshed per navigation).
- **Phase 4 — Money & Insight:** income, expenses, dashboard, reports
  (PDF/Excel), search & filters, notifications.
- **Phase 5 — Data & Governance:** Excel/CSV import (validation + dedup),
  export.
