# Design Spec — Universal Mandal CRM

## Phase 2: Core Financial

**Date:** 2026-08-23
**Builds on:** Phase 1 (Foundation & Tenancy) — approved & implemented
**Source PRD:** `Universal_Mandal_Financial_CRM_PRD.md` §9–§15, §24–§26, §33
**Status:** Approved for planning

---

## 1. Purpose

Add the financial core on top of the Phase-1 foundation: financial years,
annual membership fees (config + assignment + year-wise tracking + historical
dues), payments with multi-year allocation, and receipts (PDF). All Phase-1
guarantees carry forward: shared-schema multi-tenancy with central
`organization_id` scoping, permission-based RBAC, audit trail, `Decimal` money,
soft-delete/void, and bilingual (en/mr) UI.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Payment model | One **Payment** with **PaymentAllocation** lines distributing it across a member's AnnualFee records (partial + multi-year). |
| Receipts | Server-generated PDF via **@react-pdf/renderer** + bundled **Noto Sans Devanagari** font (pure JS, Docker-friendly). |
| Fee assignment | **All methods**: generate-for-all-active, bulk-select, manual — with duplicate (member+FY) prevention. |
| Payment modes | Configurable per-org entity (seeded Cash, UPI, Bank Transfer, Cheque, Other). |
| Receipt numbering | Sequential per org using the org's `receiptNumberPrefix` (atomic counter, like member codes). |
| Fee amount | **Snapshotted** onto AnnualFee at assignment (changing a FY's fee never rewrites history). |
| Allocation UX | Auto-fills oldest-dues-first; editable before save. |

## 3. Data model additions

All tenant-owned tables carry indexed `organizationId`. Money = `Decimal @db.Decimal(12,2)`.

### FinancialYear
`id, organizationId, label, startDate, endDate, feeAmount, isActive, isClosed,
createdAt, updatedAt` — unique `[organizationId, label]`.

### PaymentMode (configurable)
`id, organizationId, name, isActive` — unique `[organizationId, name]`.

### AnnualFee
`id, organizationId, memberId, financialYearId, feeAmount (snapshot), status
(Pending|Partial|Paid|Waived|Exempted|Cancelled), notes?, createdBy, createdAt,
updatedAt` — unique `[organizationId, memberId, financialYearId]`.

### Payment
`id, organizationId, memberId, paymentDate, amount, paymentModeId,
referenceNumber?, collectedBy, notes?, isVoided (default false), voidedReason?,
createdAt, updatedAt`.

### PaymentAllocation
`id, organizationId, paymentId, annualFeeId, amount` — index `[paymentId]`,
`[annualFeeId]`.

### Receipt
`id, organizationId, receiptNumber (unique per org), paymentId (unique 1:1),
memberId, receiptDate, createdAt`.

### Organization (add)
`receiptSeq Int @default(0)` — atomic receipt-number counter.

**Tenant-model set** extends to include `FinancialYear, PaymentMode, AnnualFee,
Payment, PaymentAllocation, Receipt` in the scoped Prisma client.

## 4. Computed values (never hand-entered)

- `paidAmount(annualFee) = Σ allocations.amount` for that fee (non-voided payments).
- `pending(annualFee) = (status ∈ {Waived,Exempted,Cancelled}) ? 0 : max(0, feeAmount − paidAmount)`.
- Derived status (unless manually Waived/Exempted/Cancelled): 0 paid → Pending,
  0 < paid < fee → Partial, paid ≥ fee → Paid.
- Member total outstanding = Σ pending across their AnnualFees.
- FY collection: expected = Σ AnnualFee.feeAmount; collected = Σ allocations;
  pending = expected − collected; % = collected/expected.

## 5. Business rules (PRD §33)

- Duplicate AnnualFee (member+FY) rejected (5).
- Partial payments supported (6); pending computed automatically (7); fully paid
  auto-Paid (8).
- Allocation amount ≤ the fee's remaining pending **and** ≤ the payment's
  unallocated remainder; total allocations ≤ payment amount.
- Receipt numbers unique within an org (9).
- Payments are **voided, not deleted** by normal users (10): voiding reverses its
  allocations (pending recomputed) and marks the receipt void-associated; audited.
- Changing a FY's `feeAmount` does not modify existing AnnualFee snapshots (16, 17).
- All financial mutations write an audit record (11); `Decimal` throughout (19);
  access is permission-gated (20).

## 6. RBAC additions

Permission catalog gains:
`financialyear.view`, `financialyear.manage`, `fee.view`, `fee.assign`,
`fee.waive`, `payment.view`, `payment.create`, `payment.void`, `receipt.view`,
`settings.payment_mode.manage`.

System-role mapping (extends Phase-1 seeds; applied on seed + new-org creation):
- **Org Admin** — all of the above.
- **Treasurer** — `financialyear.view`, `fee.view/assign/waive`,
  `payment.view/create/void`, `receipt.view` (finance-focused, PRD §5.3; not
  `financialyear.manage` or `settings.payment_mode.manage`).
- **Data Entry Operator** — `fee.view`, `payment.view/create`, `receipt.view`.
- **Committee Member** — `financialyear.view`, `fee.view`, `payment.view`,
  `receipt.view` (read-only).

## 7. Screens

- **Financial Years** (`/finance/years`): list; create (label + fee; start/end
  auto-derived from org FY months); set active; close.
- **Fee Assignment** (`/finance/years/[id]`): year detail with collection
  summary; "Generate for all active members"; bulk-select assign; manual add;
  waive/exempt a fee.
- **Record Payment** (`/payments/new`): choose member → shows pending AnnualFees
  → amount + mode + reference → allocation grid (auto oldest-first, editable) →
  save → receipt auto-created → link to receipt PDF.
- **Payments** (`/payments`): list with filters; void action.
- **Pending Dues** (`/finance/pending`): members with outstanding — name, mobile,
  pending years, total, last payment date.
- **Receipts** (`/receipts`): list; **PDF download** (`/receipts/[id]/pdf`).
- **Payment Modes** settings (`/settings/payment-modes`).
- **Member profile**: Annual Fees / Payments / Receipts tabs go live.
- **Dashboard**: current-FY collection tiles (expected, collected, pending, %,
  paid vs pending members) alongside the existing member counts.

## 8. Receipt PDF

`@react-pdf/renderer`; Noto Sans Devanagari TTF bundled at
`public/fonts/NotoSansDevanagari-Regular.ttf` (+ bold), registered at render.
`GET /receipts/[id]/pdf` (permission `receipt.view`, tenant-scoped) streams
`application/pdf`: org name + logo, receipt no. + date, member name + code,
per-year allocation lines, total (words optional), mode, reference, collected-by,
authorized person, org contact — rendered in the org's `defaultLocale`.

## 9. Testing (TDD)

- **Unit/integration:** FY create + fee derivation; assignment (auto-all, bulk,
  manual, duplicate rejection, fee snapshot); payment + allocation (partial,
  multi-year, over-allocation rejected, unallocated remainder); pending/status
  computation; receipt-number uniqueness/atomicity; void reverses allocations
  and recomputes pending; tenant isolation on every new model; PDF route returns
  PDF bytes.
- **E2E (Playwright):** create FY → assign fees to members → record a split
  payment across two years → pending updates on the profile → open the receipt
  PDF → pending-dues list reflects remaining → void a payment restores pending.

## 10. Out of scope (later phases)

WhatsApp (Phase 3), income/expense (Phase 4), full reports & exports (Phase 4/5),
CSV import of historical dues/payments (Phase 5). The Annual-Fee tab surfaces
historical dues entered via assignment; bulk historical import comes in Phase 5.
