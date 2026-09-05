/**
 * Muster (मस्टर) — a single editable register of all members and their yearly
 * vargani. Shared types between the server layer (query/actions) and the grid.
 *
 * Money values cross the wire as decimal strings (same convention as FeeRow).
 */

export type MusterYear = {
  id: string;
  label: string;
  /** The year's default vargani (used when auto-assigning a fee from the grid). */
  feeAmount: string;
};

/** One member × year vargani cell. Absent from `cells` = no fee assigned yet. */
export type MusterCell = {
  feeAmount: string;
  paid: string;
  pending: string;
  /** Derived AnnualFee status: Paid | Partial | Pending | Waived | Exempted */
  status: string;
};

export type MusterMember = {
  id: string;
  memberCode: string;
  fullName: string;
  fullNameEn: string | null;
  mobile: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
  /** key = financialYearId */
  cells: Record<string, MusterCell>;
};

export type MusterData = {
  years: MusterYear[];
  /** All members (active AND inactive) ordered by memberCode; client filters. */
  members: MusterMember[];
};

/* ------------------------------------------------------------- action results */

export type MusterErr =
  | "INVALID_AMOUNT"
  | "LOWER_THAN_PAID"
  | "EXCEEDS_FEE"
  | "WAIVED"
  | "NO_PAYMENT_MODE"
  | "MULTI_YEAR_PAYMENT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NAME_REQUIRED"
  | "SAVE_FAILED";

export type MusterSetPaidResult =
  | { ok: true; cell: MusterCell; receiptNumber?: string }
  /** LOWER_THAN_PAID carries the currently-paid amount so the UI can offer
   *  a correction (void the wrong payment + re-record) with real numbers. */
  | { ok: false; error: MusterErr; paid?: string };

export type MusterUpdateMemberResult = { ok: true } | { ok: false; error: MusterErr };

export type MusterQuickAddResult =
  | { ok: true; member: MusterMember }
  | { ok: false; error: MusterErr };

export type MusterSimpleResult = { ok: true } | { ok: false; error: MusterErr };
