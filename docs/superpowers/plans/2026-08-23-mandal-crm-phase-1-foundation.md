# Universal Mandal CRM — Phase 1 (Foundation & Tenancy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the multi-tenant foundation of the Universal Mandal CRM — organizations, authentication, permission-based RBAC, configurable settings, member management, and a cross-cutting audit trail — on Next.js + PostgreSQL + Prisma.

**Architecture:** A single Next.js (App Router, TypeScript) codebase using server actions for mutations. Multi-tenancy is shared-schema: every tenant-owned row carries `organization_id`, and a Prisma client extension backed by an `AsyncLocalStorage` tenant context injects that scope into every query so features cannot leak cross-org data. Auth.js (credentials) provides sessions; authorization is checked against a granular permission catalog, not role names. Money is `Decimal` end-to-end; business records are voided, never hard-deleted; and mutations write audit records.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript 5, PostgreSQL 16, Prisma 6, Auth.js v5 (`next-auth@5`), `next-intl` 3 (en/mr), Tailwind CSS 4, Zod, argon2, Vitest 3 + Testing Library, Docker Compose.

## Global Constraints

- **Package manager:** npm. **Node:** ≥ 20.
- **Money:** all monetary values use Prisma `Decimal` / Postgres `NUMERIC(12,2)` — never `Float`/`number`.
- **Tenant isolation:** every tenant-owned table has an indexed `organization_id`; all access to tenant-owned models goes through the scoped Prisma client (`db`), never the raw client (`rawDb`) except in explicitly platform-level (super-admin) code paths.
- **Authorization:** server actions/route handlers gate on a permission **key** (e.g. `member.create`), never on a role name.
- **No hard-coding of org data:** organization name, logo, branding, fees, prefixes, categories, statuses, and templates live in the DB. The initial org is Narveer Tanaji Malusare Pratishthan, Kharabwadi, seeded from `logo.png`.
- **Passwords:** hashed with argon2id. Never logged, never returned to the client.
- **Deletion:** business records (members, etc.) are deactivated/voided via status/`is_active`, not deleted.
- **i18n:** all user-facing strings come from `next-intl` message catalogs (`en`, `mr`). No hard-coded UI copy in components.
- **Validation:** every server action validates input with a Zod schema before touching the DB.
- **Tests:** TDD — write the failing test first. Integration tests run against a real Postgres test database (`DATABASE_URL_TEST`), truncated before each test.
- **Commits:** one commit per completed task step group, conventional-commit style, ending with the repo's Co-Authored-By/Claude-Session trailer.

---

## File Structure

```
narveer/
├── package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs
├── vitest.config.ts, vitest.setup.ts, eslint.config.mjs
├── .env.example, .env, .env.test, .gitignore
├── Dockerfile, docker-compose.yml, .dockerignore
├── prisma/
│   ├── schema.prisma            # all Phase-1 models
│   └── seed.ts                  # idempotent seed (permissions, Narveer org, roles)
├── messages/
│   ├── en.json                  # English catalog
│   └── mr.json                  # Marathi catalog
├── src/
│   ├── i18n/
│   │   ├── routing.ts           # next-intl locales (en, mr), default
│   │   └── request.ts           # per-request locale/messages
│   ├── middleware.ts            # next-intl + auth locale middleware
│   ├── lib/
│   │   ├── db/
│   │   │   ├── raw.ts           # rawDb: unscoped PrismaClient singleton
│   │   │   ├── tenant-context.ts# AsyncLocalStorage tenant context
│   │   │   └── prisma.ts        # db: tenant-scoped extended client
│   │   ├── auth/
│   │   │   ├── password.ts      # argon2 hash/verify
│   │   │   ├── config.ts        # Auth.js config (credentials)
│   │   │   └── session.ts       # getSessionUser, requireUser helpers
│   │   ├── rbac/
│   │   │   ├── permissions.ts   # PERMISSIONS catalog + types
│   │   │   ├── check.ts         # hasPermission / requirePermission
│   │   │   └── roles.ts         # SYSTEM_ROLES definitions
│   │   ├── audit/audit.ts       # writeAudit()
│   │   ├── money/money.ts       # formatINR / parseAmount
│   │   ├── membercode/generate.ts # nextMemberCode()
│   │   ├── storage/
│   │   │   ├── provider.ts      # StorageProvider interface
│   │   │   └── local.ts         # LocalStorageProvider (disk volume)
│   │   └── validation/…         # (colocated per feature)
│   ├── features/
│   │   ├── organizations/       # actions.ts, schema.ts, components/
│   │   ├── setup/               # wizard actions + steps
│   │   ├── settings/            # membership types, member statuses, org profile
│   │   ├── users/               # user CRUD + password reset
│   │   ├── roles/               # role & permission management
│   │   └── members/             # member CRUD, list/search, profile shell
│   ├── components/
│   │   ├── shell/               # AppShell, Nav (role-aware), Branding, LocaleToggle
│   │   └── ui/                  # Button, Input, Table, Field, etc.
│   └── app/
│       ├── layout.tsx
│       ├── [locale]/
│       │   ├── layout.tsx
│       │   ├── (auth)/login, change-password, reset
│       │   ├── (super)/organizations
│       │   └── (app)/dashboard(shell), members, settings, users, roles, setup
│       └── api/auth/[...nextauth]/route.ts
└── src/test/
    ├── db.ts                    # migrate + truncate helpers
    └── factories.ts             # test data builders
```

---

## Task 1: Project scaffolding & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `.env`, `.env.test`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/lib/smoke.ts`, `src/lib/smoke.test.ts`
- Create: `docker-compose.yml`, `Dockerfile`, `.dockerignore`

**Interfaces:**
- Produces: `npm test` (Vitest), `npm run dev`/`build` (Next.js), a Postgres service on `localhost:5432`, and env vars `DATABASE_URL`, `DATABASE_URL_TEST`, `AUTH_SECRET`.

- [ ] **Step 1: Scaffold and install**

Run in project root (which already contains `docs/`, `PRD`, `logo.png`):
```bash
npm init -y
npm i next@15 react@19 react-dom@19 @prisma/client@6 next-auth@^5 next-intl@^3 zod argon2
npm i -D typescript @types/react @types/node @types/react-dom prisma@6 vitest@3 @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom eslint eslint-config-next tailwindcss@4 @tailwindcss/postcss postcss tsx dotenv-cli
```

- [ ] **Step 2: Create config files**

`.gitignore`:
```
node_modules
.next
.env
.env.test
/coverage
/uploads
*.log
```

`tsconfig.json` (Next.js defaults + path alias `@/*` → `src/*`, `strict: true`).

`next.config.ts`:
```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const nextConfig: NextConfig = { experimental: { serverActions: { bodySizeLimit: "5mb" } } };
export default withNextIntl(nextConfig);
```

`.env.example` (copy to `.env` and `.env.test` with a distinct DB name for test):
```
DATABASE_URL="postgresql://crm:crm@localhost:5432/mandal_crm?schema=public"
DATABASE_URL_TEST="postgresql://crm:crm@localhost:5432/mandal_crm_test?schema=public"
AUTH_SECRET="change-me-32-bytes-min"
AUTH_URL="http://localhost:3000"
STORAGE_LOCAL_DIR="./uploads"
```

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm
      POSTGRES_DB: mandal_crm
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
  app:
    build: .
    env_file: [.env]
    ports: ["3000:3000"]
    depends_on: [postgres]
volumes: { pgdata: {} }
```

`Dockerfile` (multi-stage Next.js standalone build) and `.dockerignore` (`node_modules`, `.next`, `.git`, `uploads`).

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    fileParallelism: false, // integration tests share one test DB
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

`vitest.setup.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset:test": "dotenv -e .env.test -- prisma migrate deploy",
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Write the smoke test**

`src/lib/smoke.ts`:
```ts
export const ping = () => "pong";
```
`src/lib/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
import { ping } from "./smoke";
test("toolchain runs", () => { expect(ping()).toBe("pong"); });
```

- [ ] **Step 4: Start Postgres and verify toolchain**

Run:
```bash
docker compose up -d postgres
npm test
npm run build
```
Expected: smoke test PASSES; `next build` succeeds.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "chore: scaffold Next.js + Prisma + Vitest + Docker toolchain"
```

---

## Task 2: i18n foundation (next-intl, en/mr, locale routing)

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `messages/en.json`, `messages/mr.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Test: `src/i18n/routing.test.ts`

**Interfaces:**
- Produces: `routing` (locales `["en","mr"]`, `defaultLocale: "en"`), `<NextIntlClientProvider>` wired in `[locale]/layout.tsx`, and message key access via `useTranslations`/`getTranslations`.

- [ ] **Step 1: Write the failing test**

`src/i18n/routing.test.ts`:
```ts
import { expect, test } from "vitest";
import { routing } from "./routing";
test("supports en and mr with en default", () => {
  expect(routing.locales).toEqual(["en", "mr"]);
  expect(routing.defaultLocale).toBe("en");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/i18n/routing.test.ts`
Expected: FAIL (`routing` not found).

- [ ] **Step 3: Implement**

`src/i18n/routing.ts`:
```ts
import { defineRouting } from "next-intl/routing";
export const routing = defineRouting({
  locales: ["en", "mr"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed",
});
export type Locale = (typeof routing.locales)[number];
```
`src/i18n/request.ts`:
```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) locale = routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
```
`src/middleware.ts`:
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
export default createMiddleware(routing);
export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
```
`messages/en.json` (seed a few keys; grows per feature):
```json
{ "app": { "name": "Mandal CRM" }, "auth": { "login": "Log in", "logout": "Log out" } }
```
`messages/mr.json`:
```json
{ "app": { "name": "मंडळ सीआरएम" }, "auth": { "login": "लॉगिन", "logout": "लॉगआउट" } }
```
`src/app/[locale]/layout.tsx` wraps children in `NextIntlClientProvider` with `setRequestLocale`; `src/app/[locale]/page.tsx` renders `useTranslations("app")("name")`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/i18n/routing.test.ts` → PASS. Also `npm run build` succeeds and `/` renders localized app name.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(i18n): next-intl routing with en/mr catalogs"
```

---

## Task 3: Prisma schema + test DB harness

**Files:**
- Create: `prisma/schema.prisma`, `src/test/db.ts`, `src/test/schema.test.ts`

**Interfaces:**
- Produces: Prisma models `Organization, User, Role, Permission, RolePermission, UserRole, Member, MembershipType, MemberStatus, AuditLog`; enums none (statuses are data). Test helpers `resetDb()` (truncate all tables) and `migrateTestDb()`.

- [ ] **Step 1: Write the schema**

`prisma/schema.prisma` — key excerpts (all money `Decimal @db.Decimal(12,2)`; every tenant table has `organizationId` + index):
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model Organization {
  id                  String   @id @default(cuid())
  name                String
  shortName           String
  logoRef             String?
  address             String?
  city                String?
  state               String?
  pinCode             String?
  contactNumber       String?
  email               String?
  website             String?
  registrationNumber  String?
  financialYearStart  Int      @default(4)   // month 1-12
  financialYearEnd    Int      @default(3)
  defaultMembershipFee Decimal @default(0) @db.Decimal(12,2)
  receiptNumberPrefix String   @default("RCPT")
  memberCodePrefix    String   @default("M")
  memberCodeSeq       Int      @default(0)
  defaultLocale       String   @default("en")
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  users        User[]
  roles        Role[]
  members      Member[]
  membershipTypes MembershipType[]
  memberStatuses  MemberStatus[]
}

model User {
  id             String   @id @default(cuid())
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  fullName       String
  loginId        String   @unique
  email          String?
  mobile         String?
  passwordHash   String
  isSuperAdmin   Boolean  @default(false)
  isActive       Boolean  @default(true)
  locale         String   @default("en")
  lastLoginAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  userRoles      UserRole[]
  @@index([organizationId])
}

model Role {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  description    String?
  isSystem       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  rolePermissions RolePermission[]
  userRoles       UserRole[]
  @@unique([organizationId, name])
  @@index([organizationId])
}

model Permission { key String @id  rolePermissions RolePermission[] }

model RolePermission {
  roleId        String
  permissionKey String
  role          Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permissionKey], references: [key])
  @@id([roleId, permissionKey])
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model MembershipType {
  id String @id @default(cuid())
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id])
  name String
  isActive Boolean @default(true)
  members Member[]
  @@unique([organizationId, name])
  @@index([organizationId])
}

model MemberStatus {
  id String @id @default(cuid())
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id])
  name String
  isTerminal Boolean @default(false)
  isActive Boolean @default(true)
  members Member[]
  @@unique([organizationId, name])
  @@index([organizationId])
}

model Member {
  id String @id @default(cuid())
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id])
  memberCode String
  fullName String
  mobile String
  whatsappNumber String?
  alternateMobile String?
  email String?
  address String?
  area String?
  dateOfBirth DateTime?
  joiningDate DateTime @default(now())
  membershipTypeId String?
  membershipType MembershipType? @relation(fields: [membershipTypeId], references: [id])
  statusId String
  status MemberStatus @relation(fields: [statusId], references: [id])
  notes String?
  photoRef String?
  isActive Boolean @default(true)
  createdBy String?
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([organizationId, memberCode])
  @@index([organizationId])
  @@index([organizationId, fullName])
  @@index([organizationId, mobile])
}

model AuditLog {
  id String @id @default(cuid())
  organizationId String?
  userId String?
  action String
  module String
  recordType String
  recordId String
  oldValue Json?
  newValue Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  @@index([organizationId])
  @@index([recordType, recordId])
}
```

- [ ] **Step 2: Generate client and migrate**

Run:
```bash
npx prisma migrate dev --name phase1_foundation
npm run db:reset:test   # apply migration to test DB
```
Expected: migration created and applied to both DBs; `@prisma/client` generated.

- [ ] **Step 3: Write the test DB harness + failing test**

`src/test/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";
export const testDb = new PrismaClient();
export async function resetDb() {
  const tables = ["AuditLog","UserRole","RolePermission","Member","MembershipType",
    "MemberStatus","Role","User","Permission","Organization"];
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );
}
```
`src/test/schema.test.ts`:
```ts
import { beforeEach, expect, test } from "vitest";
import { testDb, resetDb } from "./db";
beforeEach(resetDb);
test("can create an organization", async () => {
  const org = await testDb.organization.create({ data: { name: "Test", shortName: "T" } });
  expect(org.id).toBeTruthy();
  expect(org.defaultMembershipFee.toString()).toBe("0");
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/test/schema.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(db): Phase-1 Prisma schema + test DB harness"
```

---

## Task 4: Tenant context + tenant-scoped Prisma client

**Files:**
- Create: `src/lib/db/raw.ts`, `src/lib/db/tenant-context.ts`, `src/lib/db/prisma.ts`
- Test: `src/lib/db/prisma.test.ts`

**Interfaces:**
- Consumes: `PrismaClient` from Task 3.
- Produces:
  - `rawDb: PrismaClient` (unscoped singleton) — from `raw.ts`.
  - `runWithTenant<T>(ctx: {organizationId: string; userId?: string; isSuperAdmin?: boolean}, fn: () => Promise<T>): Promise<T>` and `getTenant(): TenantContext | undefined` — from `tenant-context.ts`.
  - `db` (extended client) — auto-injects `organizationId` for **tenant models**: `Member, MembershipType, MemberStatus, Role, UserRole, AuditLog`. Reads without a tenant context throw for tenant models.

- [ ] **Step 1: Write the failing test**

`src/lib/db/prisma.test.ts`:
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { db } from "./prisma";
import { runWithTenant } from "./tenant-context";

beforeEach(resetDb);

test("scoped client isolates orgs and injects organizationId", async () => {
  const a = await testDb.organization.create({ data: { name: "A", shortName: "A" } });
  const b = await testDb.organization.create({ data: { name: "B", shortName: "B" } });
  const statusA = await testDb.memberStatus.create({ data: { organizationId: a.id, name: "Active" } });
  const statusB = await testDb.memberStatus.create({ data: { organizationId: b.id, name: "Active" } });

  await runWithTenant({ organizationId: a.id }, async () => {
    // create without passing organizationId — extension injects it
    await db.member.create({ data: { memberCode: "M0001", fullName: "Alice", mobile: "1", statusId: statusA.id } });
  });
  await runWithTenant({ organizationId: b.id }, async () => {
    await db.member.create({ data: { memberCode: "M0001", fullName: "Bob", mobile: "2", statusId: statusB.id } });
  });

  const fromA = await runWithTenant({ organizationId: a.id }, () => db.member.findMany());
  expect(fromA).toHaveLength(1);
  expect(fromA[0].fullName).toBe("Alice");
  expect(fromA[0].organizationId).toBe(a.id);
});

test("tenant model access without context throws", async () => {
  await expect(db.member.findMany()).rejects.toThrow(/tenant/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/db/prisma.test.ts`
Expected: FAIL (`db`/`runWithTenant` not found).

- [ ] **Step 3: Implement**

`src/lib/db/raw.ts`:
```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { rawDb?: PrismaClient };
export const rawDb = g.rawDb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.rawDb = rawDb;
```
`src/lib/db/tenant-context.ts`:
```ts
import { AsyncLocalStorage } from "node:async_hooks";
export type TenantContext = { organizationId: string; userId?: string; isSuperAdmin?: boolean };
const als = new AsyncLocalStorage<TenantContext>();
export const getTenant = () => als.getStore();
export function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}
```
`src/lib/db/prisma.ts`:
```ts
import { rawDb } from "./raw";
import { getTenant } from "./tenant-context";

const TENANT_MODELS = new Set(["Member","MembershipType","MemberStatus","Role","UserRole","AuditLog"]);
const READ_OPS = new Set(["findFirst","findMany","findUnique","count","aggregate","groupBy","updateMany","deleteMany"]);
const WRITE_CREATE = new Set(["create","createMany"]);

export const db = rawDb.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) return query(args);
        const ctx = getTenant();
        if (!ctx) throw new Error(`Tenant context required to access model ${model}`);
        const orgId = ctx.organizationId;
        const a: any = args ?? {};
        if (READ_OPS.has(operation) || operation === "update" || operation === "delete" || operation === "upsert") {
          a.where = { ...(a.where ?? {}), organizationId: orgId };
        }
        if (WRITE_CREATE.has(operation)) {
          if (operation === "create") a.data = { ...(a.data ?? {}), organizationId: orgId };
          if (operation === "createMany") {
            const d = a.data;
            a.data = Array.isArray(d) ? d.map((x: any) => ({ ...x, organizationId: orgId }))
                                      : { ...d, organizationId: orgId };
          }
        }
        if (operation === "upsert") {
          a.create = { ...(a.create ?? {}), organizationId: orgId };
        }
        return query(a);
      },
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/db/prisma.test.ts` → PASS (both tests).

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(db): tenant context + scoped Prisma client with isolation test"
```

---

## Task 5: Money utility (Decimal formatting)

**Files:**
- Create: `src/lib/money/money.ts`
- Test: `src/lib/money/money.test.ts`

**Interfaces:**
- Produces: `formatINR(value: Prisma.Decimal | string | number): string` (e.g. `"₹1,00,000.00"`, Indian grouping), `parseAmount(input: string): Prisma.Decimal` (throws on invalid/negative).

- [ ] **Step 1: Write the failing test**
```ts
import { expect, test } from "vitest";
import { formatINR, parseAmount } from "./money";
test("formats with Indian grouping", () => {
  expect(formatINR("100000")).toBe("₹1,00,000.00");
  expect(formatINR("1200.5")).toBe("₹1,200.50");
});
test("parseAmount rejects invalid", () => {
  expect(parseAmount("500").toString()).toBe("500");
  expect(() => parseAmount("-1")).toThrow();
  expect(() => parseAmount("abc")).toThrow();
});
```
- [ ] **Step 2: Run to verify it fails** — `npm test src/lib/money/money.test.ts` → FAIL.
- [ ] **Step 3: Implement**
```ts
import { Prisma } from "@prisma/client";
const fmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatINR(value: Prisma.Decimal | string | number): string {
  return "₹" + fmt.format(Number(value.toString()));
}
export function parseAmount(input: string): Prisma.Decimal {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim())) throw new Error("Invalid amount");
  return new Prisma.Decimal(input.trim());
}
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(money): INR Decimal formatting + parsing"`

---

## Task 6: Password hashing utility

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `src/lib/auth/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(hash: string, plain: string): Promise<boolean>`.

- [ ] **Step 1: Write the failing test**
```ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";
test("hashes and verifies", async () => {
  const h = await hashPassword("secret123");
  expect(h).not.toBe("secret123");
  expect(await verifyPassword(h, "secret123")).toBe(true);
  expect(await verifyPassword(h, "wrong")).toBe(false);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement**
```ts
import argon2 from "argon2";
export const hashPassword = (plain: string) => argon2.hash(plain, { type: argon2.argon2id });
export const verifyPassword = (hash: string, plain: string) =>
  argon2.verify(hash, plain).catch(() => false);
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(auth): argon2 password hashing"`

---

## Task 7: Permission catalog + RBAC checks

**Files:**
- Create: `src/lib/rbac/permissions.ts`, `src/lib/rbac/roles.ts`, `src/lib/rbac/check.ts`
- Test: `src/lib/rbac/check.test.ts`

**Interfaces:**
- Produces:
  - `PERMISSIONS: readonly PermissionKey[]` and type `PermissionKey`.
  - `SYSTEM_ROLES: { name: string; description: string; permissions: PermissionKey[] }[]`.
  - `hasPermission(perms: string[], key: PermissionKey): boolean`.
  - `resolveUserPermissions(userId: string): Promise<string[]>` (unions permissions across the user's roles; super admins get all org-permissionless platform keys). Uses `rawDb`.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { PERMISSIONS, hasPermission, resolveUserPermissions } from "./check";

beforeEach(resetDb);
test("catalog contains member.create and hasPermission works", () => {
  expect(PERMISSIONS).toContain("member.create");
  expect(hasPermission(["member.view","member.create"], "member.create")).toBe(true);
  expect(hasPermission(["member.view"], "member.create")).toBe(false);
});
test("resolveUserPermissions unions role permissions", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  await testDb.permission.createMany({ data: [{ key: "member.view" }, { key: "member.create" }] });
  const role = await testDb.role.create({ data: { organizationId: org.id, name: "Ops",
    rolePermissions: { create: [{ permissionKey: "member.view" }, { permissionKey: "member.create" }] } } });
  const user = await testDb.user.create({ data: { organizationId: org.id, fullName: "U",
    loginId: "u1", passwordHash: "x", userRoles: { create: [{ roleId: role.id }] } } });
  const perms = await resolveUserPermissions(user.id);
  expect(perms.sort()).toEqual(["member.create","member.view"]);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/rbac/permissions.ts`:
```ts
export const PERMISSIONS = [
  "org.view","org.create","org.manage",
  "member.view","member.create","member.edit","member.void",
  "user.view","user.create","user.edit","user.deactivate",
  "role.view","role.manage",
  "settings.org.manage","settings.membership_type.manage","settings.member_status.manage",
  "audit.view",
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number];
```
`src/lib/rbac/roles.ts`:
```ts
import type { PermissionKey } from "./permissions";
export const SYSTEM_ROLES: { name: string; description: string; permissions: PermissionKey[] }[] = [
  { name: "Org Admin", description: "Full access within the organization",
    permissions: ["org.view","member.view","member.create","member.edit","member.void",
      "user.view","user.create","user.edit","user.deactivate","role.view","role.manage",
      "settings.org.manage","settings.membership_type.manage","settings.member_status.manage","audit.view"] },
  { name: "Treasurer", description: "Finance-focused access", permissions: ["member.view"] },
  { name: "Committee Member", description: "View-only operational access", permissions: ["member.view"] },
  { name: "Data Entry Operator", description: "Member data entry",
    permissions: ["member.view","member.create","member.edit"] },
];
// Super Admin is represented by User.isSuperAdmin and the platform keys org.*
export const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = ["org.view","org.create","org.manage"];
```
`src/lib/rbac/check.ts`:
```ts
import { rawDb } from "@/lib/db/raw";
import { SUPER_ADMIN_PERMISSIONS } from "./roles";
export { PERMISSIONS, type PermissionKey } from "./permissions";
import type { PermissionKey } from "./permissions";

export function hasPermission(perms: string[], key: PermissionKey): boolean {
  return perms.includes(key);
}
export async function resolveUserPermissions(userId: string): Promise<string[]> {
  const user = await rawDb.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } },
  });
  if (!user) return [];
  if (user.isSuperAdmin) return [...SUPER_ADMIN_PERMISSIONS];
  const set = new Set<string>();
  for (const ur of user.userRoles) for (const rp of ur.role.rolePermissions) set.add(rp.permissionKey);
  return [...set];
}
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(rbac): permission catalog, system roles, permission resolution"`

---

## Task 8: Auth.js configuration + session helpers

**Files:**
- Create: `src/lib/auth/config.ts`, `src/lib/auth/session.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Test: `src/lib/auth/authorize.test.ts`

**Interfaces:**
- Consumes: `verifyPassword` (Task 6), `resolveUserPermissions` (Task 7), `rawDb`.
- Produces:
  - `authorizeCredentials(loginId: string, password: string): Promise<AuthUser | null>` — pure function (tested directly): returns `{ id, organizationId, isSuperAdmin, fullName, locale }` or null; rejects inactive users and bad passwords; updates `lastLoginAt`.
  - Auth.js `handlers`, `auth`, `signIn`, `signOut` from `config.ts`; session augmented with `user.id`, `user.organizationId`, `user.isSuperAdmin`, `user.permissions`.
  - `getSessionUser()` and `requireUser()` from `session.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { authorizeCredentials } from "./config";
import { hashPassword } from "./password";

beforeEach(resetDb);
async function makeUser(active = true) {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  return testDb.user.create({ data: { organizationId: org.id, fullName: "Amit", loginId: "amit",
    passwordHash: await hashPassword("pass1234"), isActive: active } });
}
test("valid credentials authorize", async () => {
  await makeUser();
  const u = await authorizeCredentials("amit", "pass1234");
  expect(u?.fullName).toBe("Amit");
});
test("wrong password rejected", async () => {
  await makeUser();
  expect(await authorizeCredentials("amit", "nope")).toBeNull();
});
test("inactive user rejected", async () => {
  await makeUser(false);
  expect(await authorizeCredentials("amit", "pass1234")).toBeNull();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/auth/config.ts`:
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { rawDb } from "@/lib/db/raw";
import { verifyPassword } from "./password";
import { resolveUserPermissions } from "@/lib/rbac/check";

export type AuthUser = { id: string; organizationId: string | null; isSuperAdmin: boolean; fullName: string; locale: string };

export async function authorizeCredentials(loginId: string, password: string): Promise<AuthUser | null> {
  const user = await rawDb.user.findFirst({
    where: { OR: [{ loginId }, { email: loginId }], isActive: true },
  });
  if (!user) return null;
  if (!(await verifyPassword(user.passwordHash, password))) return null;
  await rawDb.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { id: user.id, organizationId: user.organizationId, isSuperAdmin: user.isSuperAdmin,
    fullName: user.fullName, locale: user.locale };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { loginId: {}, password: {} },
    authorize: async (c) => authorizeCredentials(String(c?.loginId ?? ""), String(c?.password ?? "")),
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthUser;
        token.uid = u.id; token.orgId = u.organizationId; token.sa = u.isSuperAdmin;
        token.perms = await resolveUserPermissions(u.id);
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.uid;
      (session.user as any).organizationId = token.orgId ?? null;
      (session.user as any).isSuperAdmin = !!token.sa;
      (session.user as any).permissions = (token.perms as string[]) ?? [];
      return session;
    },
  },
});
```
`src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@/lib/auth/config";
export const { GET, POST } = handlers;
```
`src/lib/auth/session.ts`:
```ts
import { auth } from "./config";
export type SessionUser = { id: string; organizationId: string | null; isSuperAdmin: boolean; permissions: string[] };
export async function getSessionUser(): Promise<SessionUser | null> {
  const s = await auth();
  if (!s?.user) return null;
  const u = s.user as any;
  return { id: u.id, organizationId: u.organizationId ?? null, isSuperAdmin: !!u.isSuperAdmin, permissions: u.permissions ?? [] };
}
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(auth): Auth.js credentials config + session helpers"`

---

## Task 9: Action guard + audit helper

**Files:**
- Create: `src/lib/rbac/guard.ts`, `src/lib/audit/audit.ts`
- Test: `src/lib/audit/audit.test.ts`, `src/lib/rbac/guard.test.ts`

**Interfaces:**
- Produces:
  - `withAction<T>(opts: { permission: PermissionKey }, fn: (ctx: ActionContext) => Promise<T>): Promise<T>` — from `guard.ts`. Loads the session user, asserts the permission, resolves `organizationId` (super-admin may pass a target org via context set elsewhere), and runs `fn` inside `runWithTenant`. `ActionContext = { user: SessionUser; organizationId: string }`.
  - `writeAudit(input: { action: string; module: string; recordType: string; recordId: string; oldValue?: unknown; newValue?: unknown }): Promise<void>` — from `audit.ts`; reads user/org from tenant context; uses `rawDb`.

- [ ] **Step 1: Write the failing tests**

`src/lib/audit/audit.test.ts`:
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { writeAudit } from "./audit";
beforeEach(resetDb);
test("writes an audit row scoped to tenant + user", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  await runWithTenant({ organizationId: org.id, userId: "u1" }, async () => {
    await writeAudit({ action: "update", module: "members", recordType: "Member",
      recordId: "m1", oldValue: { fee: "500" }, newValue: { fee: "1000" } });
  });
  const rows = await testDb.auditLog.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBe(org.id);
  expect(rows[0].userId).toBe("u1");
  expect(rows[0].action).toBe("update");
});
```
`src/lib/rbac/guard.test.ts`:
```ts
import { expect, test, vi, beforeEach } from "vitest";
import * as session from "@/lib/auth/session";
import { withAction } from "./guard";
beforeEach(() => vi.restoreAllMocks());
test("denies when permission missing", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u1", organizationId: "o1", isSuperAdmin: false, permissions: ["member.view"] });
  await expect(withAction({ permission: "member.create" }, async () => "ok")).rejects.toThrow(/FORBIDDEN/);
});
test("allows and runs within tenant when permitted", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u1", organizationId: "o1", isSuperAdmin: false, permissions: ["member.create"] });
  const r = await withAction({ permission: "member.create" }, async (ctx) => ctx.organizationId);
  expect(r).toBe("o1");
});
```
- [ ] **Step 2: Run to verify they fail** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/audit/audit.ts`:
```ts
import { rawDb } from "@/lib/db/raw";
import { getTenant } from "@/lib/db/tenant-context";
export async function writeAudit(input: {
  action: string; module: string; recordType: string; recordId: string;
  oldValue?: unknown; newValue?: unknown;
}): Promise<void> {
  const ctx = getTenant();
  await rawDb.auditLog.create({ data: {
    organizationId: ctx?.organizationId ?? null,
    userId: ctx?.userId ?? null,
    action: input.action, module: input.module,
    recordType: input.recordType, recordId: input.recordId,
    oldValue: (input.oldValue ?? undefined) as any,
    newValue: (input.newValue ?? undefined) as any,
  } });
}
```
`src/lib/rbac/guard.ts`:
```ts
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { hasPermission, type PermissionKey } from "./check";
import { runWithTenant } from "@/lib/db/tenant-context";
export type ActionContext = { user: SessionUser; organizationId: string };
export async function withAction<T>(
  opts: { permission: PermissionKey; organizationId?: string },
  fn: (ctx: ActionContext) => Promise<T>,
): Promise<T> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!hasPermission(user.permissions, opts.permission)) throw new Error("FORBIDDEN");
  const organizationId = opts.organizationId ?? user.organizationId;
  if (!organizationId) throw new Error("NO_ORG_CONTEXT");
  return runWithTenant({ organizationId, userId: user.id, isSuperAdmin: user.isSuperAdmin }, () =>
    fn({ user, organizationId }));
}
```
- [ ] **Step 4: Run to verify they pass** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(rbac,audit): action guard + audit writer"`

---

## Task 10: Member code generator

**Files:**
- Create: `src/lib/membercode/generate.ts`
- Test: `src/lib/membercode/generate.test.ts`

**Interfaces:**
- Produces: `nextMemberCode(organizationId: string): Promise<string>` — atomically increments `Organization.memberCodeSeq` and returns `prefix + zero-padded(seq, 4)`; unique per org even under concurrency. Uses `rawDb` inside a transaction.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { nextMemberCode } from "./generate";
beforeEach(resetDb);
test("generates sequential unique codes", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O", memberCodePrefix: "NTM" } });
  const codes = await Promise.all(Array.from({ length: 5 }, () => nextMemberCode(org.id)));
  expect(new Set(codes).size).toBe(5);
  expect(codes).toContain("NTM0001");
  expect(codes).toContain("NTM0005");
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement**
```ts
import { rawDb } from "@/lib/db/raw";
export async function nextMemberCode(organizationId: string): Promise<string> {
  return rawDb.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { memberCodeSeq: { increment: 1 } },
      select: { memberCodePrefix: true, memberCodeSeq: true },
    });
    return `${org.memberCodePrefix}${String(org.memberCodeSeq).padStart(4, "0")}`;
  });
}
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(members): atomic per-org member code generator"`

---

## Task 11: Storage provider (local)

**Files:**
- Create: `src/lib/storage/provider.ts`, `src/lib/storage/local.ts`, `src/lib/storage/index.ts`
- Test: `src/lib/storage/local.test.ts`

**Interfaces:**
- Produces: `interface StorageProvider { save(key: string, data: Buffer, contentType: string): Promise<string>; url(ref: string): string; read(ref: string): Promise<Buffer> }`; `LocalStorageProvider` writing under `STORAGE_LOCAL_DIR`; `storage` singleton from `index.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { expect, test } from "vitest";
import { LocalStorageProvider } from "./local";
import { rm } from "node:fs/promises";
test("saves and reads a file", async () => {
  const dir = "./uploads-test";
  const s = new LocalStorageProvider(dir);
  const ref = await s.save("logos/x.png", Buffer.from("hello"), "image/png");
  expect(await s.read(ref)).toEqual(Buffer.from("hello"));
  expect(s.url(ref)).toContain("x.png");
  await rm(dir, { recursive: true, force: true });
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** — `provider.ts` (interface), `local.ts`:
```ts
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./provider";
export class LocalStorageProvider implements StorageProvider {
  constructor(private baseDir = process.env.STORAGE_LOCAL_DIR ?? "./uploads") {}
  async save(key: string, data: Buffer): Promise<string> {
    const full = path.join(this.baseDir, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return key;
  }
  url(ref: string) { return `/uploads/${ref}`; }
  read(ref: string) { return readFile(path.join(this.baseDir, ref)); }
}
```
`index.ts` exports `export const storage = new LocalStorageProvider();`.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(storage): local file storage provider"`

---

## Task 12: Seed script (permissions, Narveer org, roles, admin, defaults)

**Files:**
- Create: `prisma/seed.ts`
- Test: `prisma/seed.test.ts`

**Interfaces:**
- Consumes: `PERMISSIONS`, `SYSTEM_ROLES` (Task 7), `hashPassword` (Task 6), `LocalStorageProvider` (Task 11), `logo.png`.
- Produces: `seed(): Promise<void>` (idempotent) — upserts all `Permission` rows; creates/updates the Narveer org (logo saved via storage), one Org Admin user (`login: admin`), the four org system roles + `member` types/statuses defaults ("Active"/"Inactive"/"Left" statuses, "General" type).

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { seed } from "./seed";
beforeEach(resetDb);
test("seed is idempotent and creates Narveer org + roles + admin", async () => {
  await seed(); await seed();
  const orgs = await testDb.organization.findMany();
  expect(orgs).toHaveLength(1);
  expect(orgs[0].name).toMatch(/Narveer/);
  const admin = await testDb.user.findUnique({ where: { loginId: "admin" } });
  expect(admin?.isSuperAdmin).toBe(false);
  const roles = await testDb.role.findMany({ where: { organizationId: orgs[0].id } });
  expect(roles.map(r => r.name)).toEqual(expect.arrayContaining(["Org Admin","Treasurer"]));
  const perms = await testDb.permission.count();
  expect(perms).toBeGreaterThan(10);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** `prisma/seed.ts` using `rawDb`, `upsert` on stable keys (org by `shortName`, user by `loginId`, roles by `[organizationId, name]`), saving `logo.png` bytes through `LocalStorageProvider` and storing the returned ref in `Organization.logoRef`. Wrap `main()` to `seed().finally(() => rawDb.$disconnect())`.
- [ ] **Step 4: Run to verify it passes** → PASS. Also run `npm run seed` against dev DB.
- [ ] **Step 5: Commit** — `git commit -m "feat(seed): permissions + Narveer org + system roles + admin"`

---

## Task 13: App shell — layout, role-aware nav, branding, locale toggle, auth pages

**Files:**
- Create: `src/components/shell/AppShell.tsx`, `src/components/shell/Nav.tsx`, `src/components/shell/Branding.tsx`, `src/components/shell/LocaleToggle.tsx`
- Create: `src/app/[locale]/(app)/layout.tsx`, `src/app/[locale]/(auth)/login/page.tsx`, `src/app/[locale]/(auth)/login/actions.ts`, `src/app/[locale]/(app)/change-password/page.tsx` + `actions.ts`
- Create: `src/components/ui/{Button,Input,Field,Table}.tsx`, extend `messages/en.json` + `messages/mr.json`
- Test: `src/components/shell/Nav.test.tsx`, `src/app/[locale]/(auth)/login/actions.test.ts`

**Interfaces:**
- Consumes: `signIn`/`signOut` (Task 8), `getSessionUser` (Task 8), `hasPermission` (Task 7).
- Produces: `<Nav permissions={...}/>` renders only links whose required permission the user holds; `loginAction(formData)` server action calling `signIn`; `changePasswordAction` verifying old password then updating hash (audited).

- [ ] **Step 1: Write the failing test** (`Nav.test.tsx` — renders Members link only with `member.view`):
```tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";
import en from "../../../messages/en.json";
import { Nav } from "./Nav";
function renderNav(permissions: string[]) {
  return render(<NextIntlClientProvider locale="en" messages={en}><Nav permissions={permissions} isSuperAdmin={false} /></NextIntlClientProvider>);
}
test("hides Members without member.view", () => {
  renderNav([]);
  expect(screen.queryByText(en.nav.members)).toBeNull();
});
test("shows Members with member.view", () => {
  renderNav(["member.view"]);
  expect(screen.getByText(en.nav.members)).toBeTruthy();
});
```
(Add a `nav` block with `members`, `settings`, `users`, `roles`, `organizations` keys to both catalogs.)
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** `Nav.tsx` mapping a `NAV_ITEMS` array `{ href, labelKey, permission?, superAdmin? }` filtered by `hasPermission`; `AppShell` composes `Branding + Nav + LocaleToggle + children`; `(app)/layout.tsx` calls `requireUser()` (redirect to `/login` if null) and passes permissions to `Nav`; login/change-password pages use `Field`/`Input`/`Button` and the server actions. Change-password action wraps in `withAction`-style auth + `writeAudit`.
- [ ] **Step 4: Run to verify it passes** → PASS. Manually verify login → shell renders branding + permitted nav; locale toggle switches en/mr.
- [ ] **Step 5: Commit** — `git commit -m "feat(shell): app shell, role-aware nav, auth pages, locale toggle"`

---

## Task 14: Super Admin — organizations list/create/activate

**Files:**
- Create: `src/features/organizations/schema.ts`, `src/features/organizations/actions.ts`, `src/app/[locale]/(super)/organizations/page.tsx`, `.../organizations/new/page.tsx`
- Test: `src/features/organizations/actions.test.ts`

**Interfaces:**
- Consumes: `getSessionUser` (super-admin gate), `rawDb` (Organization is platform-level, not tenant-scoped), `writeAudit`.
- Produces: `createOrganization(input): Promise<Organization>` (requires `org.create` + `isSuperAdmin`), `setOrganizationActive(id, active): Promise<void>` (`org.manage`), `listOrganizations(): Promise<Organization[]>` (`org.view`). Zod schema validates name/shortName/contact/email.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createOrganization, setOrganizationActive } from "./actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
function asSuperAdmin() {
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "sa", organizationId: null, isSuperAdmin: true, permissions: ["org.view","org.create","org.manage"] });
}
test("super admin creates and deactivates an org", async () => {
  asSuperAdmin();
  const org = await createOrganization({ name: "New Mandal", shortName: "NM" });
  expect(org.isActive).toBe(true);
  await setOrganizationActive(org.id, false);
  const after = await testDb.organization.findUnique({ where: { id: org.id } });
  expect(after?.isActive).toBe(false);
});
test("non-super-admin cannot create org", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: "o", isSuperAdmin: false, permissions: [] });
  await expect(createOrganization({ name: "X", shortName: "X" })).rejects.toThrow(/FORBIDDEN|UNAUTH/);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** actions using a small `requireSuperAdmin(permission)` helper (checks session + `isSuperAdmin` + permission), operating on `rawDb.organization`, each mutation calling `writeAudit`. Pages: list table + create form (server action).
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(organizations): super-admin org CRUD + activation"`

---

## Task 15: Organization setup wizard

**Files:**
- Create: `src/features/setup/schema.ts`, `src/features/setup/actions.ts`, `src/app/[locale]/(app)/setup/page.tsx` (stepper), step components
- Test: `src/features/setup/actions.test.ts`

**Interfaces:**
- Consumes: `withAction` (`settings.org.manage`), `db`/`rawDb`, `writeAudit`, `storage` (logo).
- Produces: `saveOrgDetails(input)`, `saveFinancialConfig(input)` (fy start/end, default fee via `parseAmount`, receipt/member prefixes), `saveCommsStub()` (no-op placeholder wired in Phase 3), `completeSetup()` (marks wizard done). Each persists to `Organization` and audits.

- [ ] **Step 1: Write the failing test** — asserts `saveFinancialConfig` stores `defaultMembershipFee` as Decimal and rejects negative fee; `saveOrgDetails` updates name/branding.
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { saveFinancialConfig } from "./actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("saves financial config as Decimal", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: org.id, isSuperAdmin: false, permissions: ["settings.org.manage"] });
  await saveFinancialConfig({ financialYearStart: 4, financialYearEnd: 3, defaultMembershipFee: "1000", receiptNumberPrefix: "NTM", memberCodePrefix: "NTM" });
  const after = await testDb.organization.findUnique({ where: { id: org.id } });
  expect(after?.defaultMembershipFee.toString()).toBe("1000");
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** actions with Zod + `parseAmount`, `withAction` gating, `db.organization`... (Organization is not tenant-scoped; update via `rawDb.organization.update({ where:{ id: ctx.organizationId }}`) + `writeAudit`. Stepper page renders current org values and posts each step.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(setup): organization setup wizard"`

---

## Task 16: Settings — membership types & member statuses

**Files:**
- Create: `src/features/settings/config-actions.ts`, `src/app/[locale]/(app)/settings/membership-types/page.tsx`, `.../settings/member-statuses/page.tsx`
- Test: `src/features/settings/config-actions.test.ts`

**Interfaces:**
- Consumes: `withAction` (`settings.membership_type.manage`, `settings.member_status.manage`), scoped `db`, `writeAudit`.
- Produces: `createMembershipType(name)`, `setMembershipTypeActive(id, active)`, `createMemberStatus(name, isTerminal)`, `setMemberStatusActive(id, active)`. All tenant-scoped via `db`.

- [ ] **Step 1: Write the failing test** — create a membership type in org A; assert it is scoped and not visible in org B; duplicate name rejected.
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createMembershipType } from "./config-actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("membership type is tenant-scoped", async () => {
  const a = await testDb.organization.create({ data: { name: "A", shortName: "A" } });
  const b = await testDb.organization.create({ data: { name: "B", shortName: "B" } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: a.id, isSuperAdmin: false, permissions: ["settings.membership_type.manage"] });
  await createMembershipType("General");
  expect(await testDb.membershipType.count({ where: { organizationId: a.id } })).toBe(1);
  expect(await testDb.membershipType.count({ where: { organizationId: b.id } })).toBe(0);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** the config actions with `withAction` + `db.membershipType`/`db.memberStatus` (organizationId auto-injected), Zod name validation, `writeAudit`, and Prisma unique-violation → friendly error. Pages list + add form.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(settings): membership types & member statuses"`

---

## Task 17: User management + role assignment + admin password reset

**Files:**
- Create: `src/features/users/schema.ts`, `src/features/users/actions.ts`, `src/app/[locale]/(app)/users/page.tsx`, `.../users/new/page.tsx`
- Test: `src/features/users/actions.test.ts`

**Interfaces:**
- Consumes: `withAction` (`user.create/edit/deactivate/view`), `rawDb` (User has nullable org, not auto-scoped — filter by `ctx.organizationId` explicitly), `hashPassword`, `writeAudit`.
- Produces: `createUser({fullName, loginId, email?, mobile?, password, roleIds})`, `setUserActive(id, active)`, `assignRoles(userId, roleIds)`, `resetUserPassword(userId, newPassword)`. All operate only within `ctx.organizationId`; cannot touch users of other orgs or super admins.

- [ ] **Step 1: Write the failing test** — create user hashes password, assigns role, is scoped to the caller's org; reset changes hash; cross-org edit rejected.
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { createUser, resetUserPassword } from "./actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("creates a scoped user with hashed password", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "admin", organizationId: org.id, isSuperAdmin: false, permissions: ["user.create","user.edit"] });
  const u = await createUser({ fullName: "Ravi", loginId: "ravi", password: "init1234", roleIds: [] });
  expect(u.organizationId).toBe(org.id);
  const dbUser = await testDb.user.findUnique({ where: { id: u.id } });
  expect(await verifyPassword(dbUser!.passwordHash, "init1234")).toBe(true);
  await resetUserPassword(u.id, "new12345");
  const after = await testDb.user.findUnique({ where: { id: u.id } });
  expect(await verifyPassword(after!.passwordHash, "new12345")).toBe(true);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** actions: all reads/writes filter `{ organizationId: ctx.organizationId, isSuperAdmin: false }`; `createUser` hashes password, connects roles (validating roles belong to the org); `resetUserPassword`/`setUserActive` verify the target user is in-org before mutating; every mutation audits. Pages: user list + create/edit form with role multi-select and reset-password action.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(users): org-scoped user management + password reset"`

---

## Task 18: Role & permission management

**Files:**
- Create: `src/features/roles/schema.ts`, `src/features/roles/actions.ts`, `src/app/[locale]/(app)/roles/page.tsx`, `.../roles/[id]/page.tsx`
- Test: `src/features/roles/actions.test.ts`

**Interfaces:**
- Consumes: `withAction` (`role.view/manage`), scoped `db.role` + `rawDb.rolePermission`, `PERMISSIONS`, `writeAudit`.
- Produces: `listRoles()`, `createRole(name, description, permissionKeys)`, `updateRolePermissions(roleId, permissionKeys)`, `deleteRole(roleId)` (blocked when `isSystem`). Validates permission keys against `PERMISSIONS`.

- [ ] **Step 1: Write the failing test** — create custom role with subset perms; update perms; system role cannot be deleted; invalid permission key rejected.
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createRole, updateRolePermissions, deleteRole } from "./actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("manages custom role permissions and protects system roles", async () => {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O" } });
  await testDb.permission.createMany({ data: [{ key: "member.view" }, { key: "member.create" }] });
  const sys = await testDb.role.create({ data: { organizationId: org.id, name: "Org Admin", isSystem: true } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: org.id, isSuperAdmin: false, permissions: ["role.manage","role.view"] });
  const role = await createRole("Volunteer", "", ["member.view"]);
  await updateRolePermissions(role.id, ["member.view","member.create"]);
  const perms = await testDb.rolePermission.count({ where: { roleId: role.id } });
  expect(perms).toBe(2);
  await expect(deleteRole(sys.id)).rejects.toThrow(/system/i);
  await expect(createRole("Bad", "", ["not.a.perm" as any])).rejects.toThrow(/permission/i);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** actions: validate every key ∈ `PERMISSIONS`; `db.role` for scoped role CRUD; replace `RolePermission` rows transactionally on update; block deletion when `isSystem`; audit each change. Pages: role list + editor with permission checkboxes grouped by prefix.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(roles): role & permission management"`

---

## Task 19: Member create/edit (actions)

**Files:**
- Create: `src/features/members/schema.ts`, `src/features/members/actions.ts`
- Test: `src/features/members/actions.test.ts`

**Interfaces:**
- Consumes: `withAction` (`member.create/edit/void`), scoped `db.member`, `nextMemberCode`, `writeAudit`.
- Produces: `createMember(input): Promise<Member>` (auto member code, requires valid `statusId`/`membershipTypeId` in-org), `updateMember(id, input)` (audits old→new), `voidMember(id)` (sets `isActive=false`, does not delete). Zod validates required `fullName`, `mobile`, `statusId`.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createMember, updateMember, voidMember } from "./actions";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
async function ctx(perms: string[]) {
  const org = await testDb.organization.create({ data: { name: "O", shortName: "O", memberCodePrefix: "NTM" } });
  const status = await testDb.memberStatus.create({ data: { organizationId: org.id, name: "Active" } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: org.id, isSuperAdmin: false, permissions: perms });
  return { org, status };
}
test("creates member with auto code and audits update", async () => {
  const { org, status } = await ctx(["member.create","member.edit","member.void"]);
  const m = await createMember({ fullName: "Sita", mobile: "9999", statusId: status.id });
  expect(m.memberCode).toBe("NTM0001");
  expect(m.organizationId).toBe(org.id);
  await updateMember(m.id, { fullName: "Sita Rao", mobile: "9999", statusId: status.id });
  expect((await testDb.auditLog.findMany({ where: { recordId: m.id } })).length).toBeGreaterThan(0);
  await voidMember(m.id);
  expect((await testDb.member.findUnique({ where: { id: m.id } }))?.isActive).toBe(false);
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** actions: `withAction`, Zod schema, verify `statusId`/`membershipTypeId` exist in org via scoped `db`, `nextMemberCode(ctx.organizationId)`, set `createdBy/updatedBy = ctx.user.id`, `writeAudit` on create/update/void. `updateMember` fetches old row for the audit `oldValue`.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(members): create/edit/void actions with audit"`

---

## Task 20: Member list, search & filters

**Files:**
- Create: `src/features/members/query.ts`, `src/app/[locale]/(app)/members/page.tsx`, `src/features/members/components/MemberFilters.tsx`, `src/features/members/components/MemberTable.tsx`
- Test: `src/features/members/query.test.ts`

**Interfaces:**
- Consumes: scoped `db.member`, `withAction` (`member.view`).
- Produces: `listMembers(params: { q?: string; statusId?: string; membershipTypeId?: string; area?: string; page?: number }): Promise<{ rows: Member[]; total: number }>` — searches `fullName`/`memberCode`/`mobile` (case-insensitive), filters, paginates (20/page), tenant-scoped.

- [ ] **Step 1: Write the failing test**
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { listMembers } from "./query";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("search by name and filter by status, scoped", async () => {
  const a = await testDb.organization.create({ data: { name: "A", shortName: "A" } });
  const b = await testDb.organization.create({ data: { name: "B", shortName: "B" } });
  const sa = await testDb.memberStatus.create({ data: { organizationId: a.id, name: "Active" } });
  const sb = await testDb.memberStatus.create({ data: { organizationId: b.id, name: "Active" } });
  await testDb.member.createMany({ data: [
    { organizationId: a.id, memberCode: "A1", fullName: "Ram Kadam", mobile: "1", statusId: sa.id },
    { organizationId: a.id, memberCode: "A2", fullName: "Shyam Patil", mobile: "2", statusId: sa.id },
    { organizationId: b.id, memberCode: "B1", fullName: "Ram Other", mobile: "3", statusId: sb.id },
  ]});
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: a.id, isSuperAdmin: false, permissions: ["member.view"] });
  const res = await listMembers({ q: "ram" });
  expect(res.total).toBe(1);
  expect(res.rows[0].fullName).toBe("Ram Kadam");
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** `listMembers` with `withAction` + `db.member.findMany`/`count` (OR across name/code/mobile with `contains`+`mode:"insensitive"`, optional filters, skip/take). Page renders `MemberFilters` (reads statuses/types) + `MemberTable` + pagination; links to member profile.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(members): list, search, filters, pagination"`

---

## Task 21: Member profile shell

**Files:**
- Create: `src/app/[locale]/(app)/members/[id]/page.tsx`, `src/features/members/components/ProfileTabs.tsx`
- Test: `src/features/members/get.test.ts` (+ `getMember`)

**Interfaces:**
- Consumes: scoped `db.member`, `withAction` (`member.view`).
- Produces: `getMember(id): Promise<MemberWithRefs | null>` (tenant-scoped, includes status + type); a profile page with **Personal** + **Membership** tabs live, and **Annual Fees / Payments / Receipts / WhatsApp** tabs present but showing "Available in a later phase" placeholders (localized).

- [ ] **Step 1: Write the failing test** — `getMember` returns the in-org member and `null` for another org's id.
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { getMember } from "./get";
beforeEach(async () => { await resetDb(); vi.restoreAllMocks(); });
test("getMember is tenant-scoped", async () => {
  const a = await testDb.organization.create({ data: { name: "A", shortName: "A" } });
  const b = await testDb.organization.create({ data: { name: "B", shortName: "B" } });
  const sb = await testDb.memberStatus.create({ data: { organizationId: b.id, name: "Active" } });
  const m = await testDb.member.create({ data: { organizationId: b.id, memberCode: "B1", fullName: "X", mobile: "1", statusId: sb.id } });
  vi.spyOn(session, "getSessionUser").mockResolvedValue(
    { id: "u", organizationId: a.id, isSuperAdmin: false, permissions: ["member.view"] });
  expect(await getMember(m.id)).toBeNull(); // belongs to org B
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** `getMember` via `withAction` + scoped `db.member.findFirst({ where:{ id }, include:{ status:true, membershipType:true }})` (returns null cross-org because scope adds `organizationId`). Page renders `ProfileTabs`; placeholder tabs use localized "later phase" copy.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(members): member profile shell with placeholder tabs"`

---

## Task 22: Phase-1 verification, docs & Docker run

**Files:**
- Create: `README.md`
- Modify: `Dockerfile`/`docker-compose.yml` if needed for `prisma migrate deploy` + `seed` on boot
- Test: full suite

**Interfaces:**
- Produces: a runnable app (`docker compose up`) that migrates, seeds Narveer with the logo, and serves login → shell → members/settings; a README with setup/run/test instructions.

- [ ] **Step 1: Run the full test suite** — `npm test`. Expected: all green, including the tenant-isolation tests.
- [ ] **Step 2: Typecheck + build** — `npx tsc --noEmit && npm run build`. Expected: clean.
- [ ] **Step 3: End-to-end manual smoke** — `docker compose up` (app runs `db:deploy` then `seed` then `start`); log in as `admin`, walk the setup wizard, add a membership type/status, create a member (verify auto code + audit row), view profile, toggle locale.
- [ ] **Step 4: Write `README.md`** — prerequisites, `.env` setup, `docker compose up`, seeded admin credentials, test command, and the Phase-2+ roadmap pointer.
- [ ] **Step 5: Commit** — `git commit -m "docs: Phase-1 README + Docker boot migrate/seed"`

---

## Self-Review

**1. Spec coverage** (each spec §5–§13 requirement → task):
- Multi-tenancy shared-schema + `organization_id` + central enforcement → Tasks 3, 4 (isolation proven by test).
- Config-over-hard-coding (org data, logo, fees, prefixes) → Tasks 3, 12, 15.
- Data model (all 10 models, Decimal money) → Task 3.
- Auth.js credentials + argon2 + login-id/email + session → Tasks 6, 8, 13.
- Password reset (admin-initiated + change-password) → Tasks 13, 17.
- Permission-based RBAC + 5 seeded roles + catalog → Tasks 7, 12, 18.
- Screens: auth, super-admin orgs, setup wizard, members (CRUD/search/filter/profile), settings (types/statuses/users/roles) → Tasks 13–21.
- Cross-cutting: audit (Task 9, used in 14–21), i18n (Task 2, used throughout), Zod validation (each action task), Decimal money (Tasks 5, 15, 19), soft-delete/void (Task 19).
- Member code prefix+sequence unique per org → Task 10.
- Storage provider for logo → Tasks 11, 12.
- Seed Narveer + logo + admin + roles → Task 12.
- Testing (unit + integration incl. cross-org isolation) → Tasks 3, 4, 16, 17, 20, 21.
- Deployment Docker/VPS → Tasks 1, 22.
- Phase-1 success criteria → Task 22 smoke + prior tests.
- Out-of-scope items (fees, payments, receipts, WhatsApp, income/expense, dashboard, reports, import/export) → correctly absent; profile tabs stubbed (Task 21).

**2. Placeholder scan:** No "TBD/implement later/handle edge cases" in code steps; the only "placeholder" is the *deliberate, localized* later-phase profile tabs (Task 21) and the comms wizard stub (Task 15), both explicitly in the spec's scope boundary.

**3. Type consistency:** `db`/`rawDb`, `runWithTenant`/`getTenant`, `withAction(ActionContext)`, `hasPermission`/`resolveUserPermissions`, `hashPassword`/`verifyPassword`, `nextMemberCode`, `writeAudit`, `formatINR`/`parseAmount`, `PERMISSIONS`/`PermissionKey`, `getSessionUser`/`requireUser`, `SessionUser` shape (`{id, organizationId, isSuperAdmin, permissions}`) are used consistently across Tasks 4–21. TENANT_MODELS excludes `Organization` and `User` (accessed via `rawDb` in Tasks 14, 17), consistent with the tenant-scoping design.
