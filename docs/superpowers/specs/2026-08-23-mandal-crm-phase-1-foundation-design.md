# Design Spec — Universal Mandal CRM

## Phase 1: Foundation & Tenancy

**Date:** 2026-08-23
**Author:** Kaizen Infotech (with Claude Code)
**Source PRD:** `Universal_Mandal_Financial_CRM_PRD.md`
**Initial tenant:** Narveer Tanaji Malusare Pratishthan, Kharabwadi
**Status:** Approved for planning

---

## 1. Purpose & context

The PRD defines a **universal, multi-organization Membership & Financial CRM** for mandals,
trusts, associations, and clubs. It is comprehensive (40 sections) and spans several
independent subsystems, so it is being delivered in **phases**, each with its own
design → plan → build → review cycle.

This document specifies **Phase 1 only: the multi-tenant foundation** — organizations,
authentication, role-based access control, organization setup, configurable settings,
member management, and a cross-cutting audit trail. Every later phase (fees, payments,
receipts, WhatsApp, income/expense, dashboard, reports, import/export) builds on this
foundation, so tenant isolation, money precision, soft-delete/void, and audit are
established here from day one.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Frontend | Next.js (React, TypeScript, App Router) |
| Backend | Next.js server actions / route handlers (single codebase) |
| Database | PostgreSQL |
| ORM | Prisma (with a tenant-scoping client extension) |
| Auth | Auth.js (credentials provider), argon2/bcrypt password hashing |
| i18n | `next-intl`, bilingual **English + Marathi (mr)**; Marathi default for member-facing/WhatsApp content |
| PDF (later phases) | react-pdf / puppeteer (Devanagari-capable fonts) |
| Excel (later phases) | exceljs / sheetjs |
| Deployment | Docker Compose (`app` + `postgres`), portable to a VPS — no serverless lock-in |
| File storage | `StorageProvider` interface; **local volume default**, S3-compatible pluggable later |
| Login identity | **Login ID or email + password** (mobile login not required) |
| Money type | PostgreSQL `NUMERIC` / Prisma `Decimal` everywhere — never float |
| Deletion policy | Soft-delete / void (no hard deletes of business records by normal users) |

## 3. Multi-tenancy architecture (foundational)

**Model:** shared database, shared schema, `organization_id` on every tenant-owned row.
Chosen over schema-per-tenant and database-per-tenant because it scales 1 → 100+ orgs
(PRD §38) with the lowest operational cost, while isolation is enforced centrally rather
than per-feature.

**Enforcement — non-negotiable rule:**
- Every tenant-owned table has an indexed `organization_id` FK.
- A **tenant-scoped Prisma client** (Prisma `$extends`) automatically injects the current
  request's `organization_id` into every `find*`, `create`, `update`, and `delete` for
  tenant-owned models. Feature code cannot accidentally read or write another org's rows.
- The current `organization_id` is resolved from the **Auth.js session** and passed
  through an async-context (request-scoped) accessor, not a global.
- **Super Admin** is the only cross-org actor (PRD §5.1) and operates only against an
  explicitly selected organization; it has **no automatic access to org financial data**.
- A regression test proves org A cannot read org B's rows through the scoped client.

This satisfies business rules 1–3, and PRD §4.3, §33.

## 4. Configuration-over-hard-coding (foundational)

Per PRD §4.4, §39 and business rules 4, 15, 16, nothing organization-specific is
compiled into source. Organization name, `logo.png`, address, contact, branding,
default fee, receipt prefix, membership types, member statuses, and (later) categories
and message templates all live in the database as **data**. The provided `logo.png` seeds
the Narveer organization's logo record; the same codebase serves any future org with no
source changes.

## 5. Data model (Phase 1 scope)

Money columns are `Decimal`. All tenant-owned tables carry `organization_id`. Standard
audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`) on business tables.

### Organization
`id, name, short_name, logo_ref, address, city, state, pin_code, contact_number,
email, website?, registration_number?, financial_year_start, financial_year_end,
default_membership_fee (Decimal), receipt_number_prefix, default_locale, is_active,
created_at, updated_at`

### User
`id, organization_id? (null for platform super admin), full_name, login_id (unique),
email?, mobile?, password_hash, is_super_admin, is_active, locale, last_login_at,
created_at, updated_at`

### Role
`id, organization_id, name, description?, is_system (seeded roles cannot be deleted),
created_at, updated_at`

### Permission (catalog) & mappings
- `Permission (key)` — static catalog seeded at deploy.
- `RolePermission (role_id, permission_key)`
- `UserRole (user_id, role_id)` — a user's roles within their organization.

### Member
`id, organization_id, member_code (unique per org), full_name, mobile, whatsapp_number?,
alternate_mobile?, email?, address?, area?, date_of_birth?, joining_date,
membership_type_id, status_id, notes?, photo_ref?, is_active, created_by, updated_by,
created_at, updated_at`

### MembershipType (configurable, per org)
`id, organization_id, name, is_active`

### MemberStatus (configurable, per org)
`id, organization_id, name, is_terminal (e.g. "Left Organization"), is_active`

### AuditLog
`id, organization_id?, user_id, action, module, record_type, record_id,
old_value (jsonb), new_value (jsonb), ip_address?, user_agent?, created_at`

**Member code generation:** configurable prefix + zero-padded incrementing sequence,
unique per organization, generated atomically to avoid duplicates (PRD §34.2).

## 6. Authentication & RBAC

- **Auth.js credentials provider**; passwords hashed with argon2 (bcrypt fallback);
  secure, http-only session cookies; server-side session validation (PRD §37).
- **Login** by `login_id` OR `email`, plus password. Self-service change-password is
  included. Password reset is **Org Admin-initiated** (an admin resets a user's
  password), since many operators have no email; email-based self-service reset is
  offered only to users who have an email on file.
- **Permission-based authorization (not role-name checks).** Every server action and
  route handler checks a specific permission key, so custom roles work correctly.

### Permission catalog — Phase 1
```
org.view            org.create          org.manage          (super admin: manage orgs)
member.view         member.create       member.edit         member.void
user.view           user.create         user.edit           user.deactivate
role.view           role.manage
settings.org.manage settings.membership_type.manage settings.member_status.manage
audit.view
```
Later phases extend the catalog with `financialyear.*`, `fee.*`, `payment.*`,
`receipt.*`, `whatsapp.*`, `income.*`, `expense.*`, `report.*`, `import.*`, `export.*`.

### Seeded system roles (per organization) and their Phase-1 permissions
| Role | Phase-1 permissions (grows in later phases) |
|---|---|
| **Super Admin** (platform) | `org.*` + system settings. **No** org financial data by default (PRD §5.1). |
| **Org Admin / President** | All org-scoped permissions. |
| **Treasurer / Finance** | `member.view` now; financial permissions activate in Phase 2. |
| **Committee Member** | `member.view` (+ report views in Phase 4). |
| **Data Entry Operator** | `member.view, member.create, member.edit` (+ payments/receipts in Phase 2). |

Roles are editable and new roles can be created (PRD §5 "configurable").

## 7. Screens & routes (Phase 1)

- **Auth:** login, logout, change password, admin-initiated password reset (+ email
  self-service reset where an email exists).
- **Super Admin:** organizations list; create organization; activate/deactivate.
- **Organization setup wizard** (PRD §6, §34.1):
  `Org details → Financial config (FY, default fee, receipt prefix) →
  Communication config (stubbed, wired in Phase 3) → Users & roles → Ready`.
- **Members:** list with global search (name, member code, mobile) and filters
  (status, membership type, area); create/edit; **member profile shell** with
  Personal + Membership tabs live now, and Annual Fees / Payments / Receipts /
  WhatsApp tabs present as placeholders for later phases (PRD §8).
- **Settings:** organization profile & branding; membership types; member statuses;
  users; roles & permissions.
- **App shell:** role-aware navigation, org branding (logo + name from settings),
  en/mr language toggle.

## 8. Cross-cutting concerns (built into the foundation)

- **Audit trail** (PRD §29): a helper records create/update/void on members, users,
  roles, and organization settings, capturing user, action, module, record id,
  old/new value (jsonb), IP, and user agent. Extended to financial actions later.
- **i18n:** `next-intl` with `en` and `mr` catalogs; Devanagari-safe fonts staged for
  later PDF work.
- **Validation:** Zod schemas on every server action / route boundary (PRD §37).
- **Currency:** `Decimal` end-to-end; a small money utility for formatting (₹, Indian
  digit grouping) — business rule 19.
- **Soft-delete / void:** business records are deactivated/voided, not destroyed
  (business rule 10; PRD §33).

## 9. Seed data

Narveer Tanaji Malusare Pratishthan (Kharabwadi) organization + its `logo.png` logo
record + one Org Admin user + the five seeded system roles with their Phase-1
permission mappings. Seeding is idempotent and re-runnable.

## 10. Testing (TDD)

Following the superpowers TDD workflow:
- **Unit:** tenant-scoping (org A cannot read org B), permission checks, member-code
  generation (uniqueness/atomicity), audit-log writes, money formatting.
- **Integration:** auth (login/logout/change password), organization setup wizard,
  member CRUD with filters and search.

## 11. Non-functional & security mapping (PRD §37, §38)

Secure auth, password hashing, RBAC, org-level isolation, input validation, audit
logging, session management, and access control on sensitive settings are all delivered
in Phase 1. Modular structure keeps Membership, Finance, WhatsApp, Reports,
Organizations, and Users independently evolvable (PRD §38 maintainability).

## 12. Phase-1 success criteria

- A Super Admin can create an organization and activate it.
- The Narveer org is seeded with its logo, an Org Admin, and the five system roles.
- An Org Admin can log in, complete the setup wizard, configure membership types /
  statuses, and manage users & roles.
- Members can be created, edited, searched, filtered, and viewed; each edit is audited.
- Tenant isolation is proven by test: no cross-organization data access.
- All money fields use `Decimal`; no organization data is hard-coded in source.

## 13. Explicitly out of scope for Phase 1 (later phases)

Financial years, annual fee configuration/assignment, year-wise fee tracking,
historical dues, payments & allocation, receipts (PDF), WhatsApp (reminders,
confirmations, receipt sharing, history, bulk), income, expenses, dashboard, reports
(PDF/Excel), search across financial records, notifications, and Excel/CSV import/export.
These are Phases 2–5 and each gets its own spec.

---

### Deferred provider decision
The WhatsApp provider (Meta Cloud API vs a BSP such as Gupshup/Interakt vs other)
is chosen at Phase 3. Phase 1/2 code depends only on a provider-agnostic messaging
interface, so the choice does not affect earlier phases.
