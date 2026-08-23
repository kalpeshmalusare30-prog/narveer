import { Prisma } from "@prisma/client";

export type FeeStatus =
  | "Pending"
  | "Partial"
  | "Paid"
  | "Waived"
  | "Exempted"
  | "Cancelled";

export const MANUAL_STATUSES: FeeStatus[] = ["Waived", "Exempted", "Cancelled"];

type Amount = Prisma.Decimal | string | number;
const dec = (v: Amount) => new Prisma.Decimal(v.toString());

export function isManualZeroStatus(status: string): boolean {
  return MANUAL_STATUSES.includes(status as FeeStatus);
}

/** Remaining pending for a fee. Manual (waived/exempted/cancelled) → 0. */
export function feePending(
  feeAmount: Amount,
  paid: Amount,
  status: string,
): Prisma.Decimal {
  if (isManualZeroStatus(status)) return new Prisma.Decimal(0);
  const pending = dec(feeAmount).minus(dec(paid));
  return pending.lessThan(0) ? new Prisma.Decimal(0) : pending;
}

/** Derived status; a manual status is preserved, otherwise computed from paid. */
export function deriveStatus(
  feeAmount: Amount,
  paid: Amount,
  manualStatus?: string | null,
): FeeStatus {
  if (manualStatus && isManualZeroStatus(manualStatus)) {
    return manualStatus as FeeStatus;
  }
  const fee = dec(feeAmount);
  const p = dec(paid);
  if (p.lessThanOrEqualTo(0)) return "Pending";
  if (p.greaterThanOrEqualTo(fee)) return "Paid";
  return "Partial";
}
