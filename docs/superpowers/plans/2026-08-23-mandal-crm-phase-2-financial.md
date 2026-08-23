# Universal Mandal CRM — Phase 2 (Core Financial) Implementation Plan

> **For agentic workers:** implement task-by-task with TDD. Each task ends with an independently testable deliverable and a commit.

**Goal:** Add financial years, annual fees (config/assignment/tracking/historical dues), payments with multi-year allocation, and PDF receipts, on the Phase-1 foundation.

**Architecture:** New tenant-scoped Prisma models reuse the Phase-1 scoped client (`db`), `withAction` guards, `writeAudit`, `Decimal` money, and next-intl UI. Pending/status are computed from allocations; receipts render via @react-pdf/renderer with a bundled Devanagari font.

## Global Constraints

- All new tables carry indexed `organizationId`; add them to `TENANT_MODELS`.
- Money = `Decimal`; allocation math uses `Prisma.Decimal`, never float.
- Every mutation gates on a permission key and writes an audit record.
- Payments are voided, not deleted; voiding reverses allocations.
- Fee amount is snapshotted at assignment; FY fee changes never rewrite history.
- Duplicate AnnualFee (member+FY) rejected; allocation ≤ min(fee remaining, payment remaining).
- Receipt numbers unique per org (atomic counter).
- Tests: TDD against the real test DB; commit per task with the repo trailer.

---

## Task 1: Schema + migration + tenant-model extension
**Files:** `prisma/schema.prisma`, `src/lib/db/prisma.ts`, `src/test/db.ts` (add new tables to truncate list)
**Deliverable:** migrated dev+test DBs; scoped client covers the new models.
- Add models FinancialYear, PaymentMode, AnnualFee, Payment, PaymentAllocation, Receipt; add `receiptSeq` to Organization; relations to Member/Organization/User.
- Extend `TENANT_MODELS` with the six new models.
- Update `resetDb()` truncate list (new tables first, respecting FKs / CASCADE).
- Run `prisma migrate dev --name phase2_financial`; apply to test DB.
- Test: schema test creates a FinancialYear + AnnualFee with Decimal fee.

## Task 2: Permissions + roles + seed
**Files:** `src/lib/rbac/permissions.ts`, `src/lib/rbac/roles.ts`, `prisma/seed.ts`, `src/features/organizations/actions.ts`
**Deliverable:** new permission keys in catalog; system roles updated; seed adds payment modes + new perms; new-org creation seeds them too.
- Add the 10 new permission keys.
- Update SYSTEM_ROLES per spec §6.
- Seed: upsert PaymentMode (Cash, UPI, Bank Transfer, Cheque, Other); ensure new permissions exist; re-map system role permissions.
- `createOrganization` seeds payment modes for new orgs.
- Test: seed idempotent; org has 5 payment modes; Treasurer role has payment.create.

## Task 3: Receipt number generator
**Files:** `src/lib/receiptnumber/generate.ts` + test
- `nextReceiptNumber(orgId)` atomically increments `Organization.receiptSeq`, returns `prefix + zero-padded(seq,4)`. Test concurrency uniqueness.

## Task 4: Financial calculations
**Files:** `src/lib/finance/calc.ts` + test
- Pure helpers: `feePending(feeAmount, paid, status)`, `deriveStatus(feeAmount, paid, manualStatus)`. Decimal-based. Tests for pending/partial/paid/waived.

## Task 5: Financial Years feature
**Files:** `src/features/finance/year-actions.ts`, `year-query.ts` + tests
- `createFinancialYear({label, feeAmount, startDate?, endDate?})` — derives start/end from org FY months when omitted; unique per org; `fee.assign`? use `financialyear.manage`.
- `setYearActive(id, active)`, `closeYear(id)`.
- `listFinancialYears()`, `getYearWithSummary(id)` (expected/collected/pending).
- Tests: create, duplicate label rejected, tenant-scoped, summary math.

## Task 6: Fee assignment feature
**Files:** `src/features/finance/fee-actions.ts`, `fee-query.ts` + tests
- `assignFeeToAllActive(financialYearId)` — creates AnnualFee (snapshot fee) for active members lacking one; returns count; skips duplicates.
- `assignFeeToMembers(financialYearId, memberIds[])`; `assignFeeManual(financialYearId, memberId)`.
- `waiveFee(annualFeeId, status)` (Waived/Exempted/Cancelled) — `fee.waive`.
- `listMemberFees(memberId)` with computed paid/pending/status; `listYearFees(financialYearId)`.
- Tests: auto-all count + dup prevention; snapshot independent of later FY fee change; waive zeroes pending; tenant isolation.

## Task 7: Payments + allocation feature
**Files:** `src/features/payments/actions.ts`, `query.ts` + tests
- `recordPayment({memberId, amount, paymentModeId, referenceNumber?, paymentDate?, allocations:[{annualFeeId, amount}], notes?})`:
  validate mode in org; validate each allocation fee belongs to member+org; each allocation ≤ fee remaining pending; Σ allocations ≤ amount; create Payment + PaymentAllocation rows + Receipt (nextReceiptNumber); audit; return {payment, receipt}.
- `voidPayment(id, reason)` — set isVoided; allocations excluded from paid math (query filters `payment.isVoided=false`); audit.
- `getMemberPendingFees(memberId)` — helper for the allocation UI (oldest-first).
- `listPayments(filters)`, `getPayment(id)`.
- Tests: split payment across 2 years updates pending; over-allocation rejected; Σ>amount rejected; void restores pending; receipt created with unique number; tenant isolation.

## Task 8: Receipts + PDF
**Files:** `src/features/receipts/query.ts`, `src/lib/pdf/receipt.tsx`, `src/app/[locale]/(app)/receipts/[id]/pdf/route.ts`, `public/fonts/NotoSansDevanagari-Regular.ttf`; deps `@react-pdf/renderer`, `@fontsource/noto-sans-devanagari`
- `listReceipts()`, `getReceiptForPdf(id)` (with member, org, allocations→fee→year, mode).
- `ReceiptDocument` React-PDF component; register Devanagari font.
- PDF route: `withAction('receipt.view')` scoped; renders to buffer; returns `application/pdf`.
- Test: getReceiptForPdf tenant-scoped; a lightweight render test (renderToBuffer returns non-empty) — may be integration-level.

## Task 9: Payment Modes settings
**Files:** `src/features/settings/paymentmode-actions.ts`, `paymentmode-query.ts`, page + add form/toggle + tests
- CRUD mirror of membership-types (`settings.payment_mode.manage`).

## Task 10: UI
**Files:** finance pages (`/finance/years`, `/finance/years/[id]`, `/finance/pending`), payments (`/payments`, `/payments/new`), receipts (`/receipts`), settings/payment-modes; member profile tabs (Annual Fees/Payments/Receipts live); dashboard tiles; Nav additions; message catalog keys (en/mr).
- Record-payment client component with member picker + allocation grid (auto oldest-first, editable, live remainder).
- Member profile: replace placeholder tabs with real fee/payment/receipt tables.
- Dashboard: current active FY collection tiles.

## Task 11: E2E + regression + docs
- Playwright: FY create → assign-all → record split payment → pending updates → receipt PDF (200 + pdf) → pending dues → void restores.
- Full unit + e2e regression; update README (Phase 2 section + roadmap tick).

## Self-Review
Covers spec §3 (Task 1), §6 (Task 2), receipt numbering (3), calc (4), FY (5), assignment incl. all methods + snapshot + dup (6), payments+allocation+void (7), receipts+PDF (8), payment modes (9), all screens incl. profile tabs + dashboard (10), testing (11). Types shared: `db`, `withAction`, `writeAudit`, `Prisma.Decimal`, `nextReceiptNumber`, calc helpers.
