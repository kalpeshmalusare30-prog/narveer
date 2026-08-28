import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";
import { feePending, deriveStatus } from "@/lib/finance/calc";

/** Sum of allocations (from non-voided payments) per annual-fee id. */
async function paidByFee(
  feeIds: string[],
): Promise<Record<string, Prisma.Decimal>> {
  const map: Record<string, Prisma.Decimal> = {};
  if (!feeIds.length) return map;
  const allocs = await db.paymentAllocation.findMany({
    where: { annualFeeId: { in: feeIds } },
    include: { payment: { select: { isVoided: true } } },
  });
  for (const a of allocs) {
    if (a.payment.isVoided) continue;
    map[a.annualFeeId] = (map[a.annualFeeId] ?? new Prisma.Decimal(0)).plus(
      a.amount,
    );
  }
  return map;
}

export type FeeRow = {
  id: string;
  financialYearId: string;
  yearLabel: string;
  feeAmount: string;
  paid: string;
  pending: string;
  status: string;
};

function toRows(
  fees: {
    id: string;
    financialYearId: string;
    feeAmount: Prisma.Decimal;
    status: string;
    financialYear: { label: string };
  }[],
  paid: Record<string, Prisma.Decimal>,
): FeeRow[] {
  return fees.map((f) => {
    const p = paid[f.id] ?? new Prisma.Decimal(0);
    return {
      id: f.id,
      financialYearId: f.financialYearId,
      yearLabel: f.financialYear.label,
      feeAmount: f.feeAmount.toString(),
      paid: p.toString(),
      pending: feePending(f.feeAmount, p, f.status).toString(),
      status: deriveStatus(f.feeAmount, p, f.status),
    };
  });
}

export async function listMemberFees(memberId: string): Promise<FeeRow[]> {
  return withAction({ permission: "fee.view" }, async () => {
    const fees = await db.annualFee.findMany({
      where: { memberId },
      include: { financialYear: true },
      orderBy: { financialYear: { startDate: "asc" } },
    });
    const paid = await paidByFee(fees.map((f) => f.id));
    return toRows(fees, paid);
  });
}

/** Fees with pending > 0 for a member, oldest first — for the payment UI. */
export async function getMemberPendingFees(
  memberId: string,
): Promise<FeeRow[]> {
  const rows = await listMemberFees(memberId);
  return rows.filter((r) => new Prisma.Decimal(r.pending).greaterThan(0));
}

export async function getMemberTotalPending(
  memberId: string,
): Promise<string> {
  const rows = await listMemberFees(memberId);
  return rows
    .reduce((t, r) => t.plus(r.pending), new Prisma.Decimal(0))
    .toString();
}

export type YearFeeRow = FeeRow & {
  memberId: string;
  memberName: string;
  memberNameEn: string | null;
  memberCode: string;
};

export async function listYearFees(
  financialYearId: string,
): Promise<YearFeeRow[]> {
  return withAction({ permission: "fee.view" }, async () => {
    const fees = await db.annualFee.findMany({
      where: { financialYearId },
      include: { financialYear: true, member: true },
      orderBy: { member: { fullName: "asc" } },
    });
    const paid = await paidByFee(fees.map((f) => f.id));
    return fees.map((f) => {
      const p = paid[f.id] ?? new Prisma.Decimal(0);
      return {
        id: f.id,
        financialYearId: f.financialYearId,
        yearLabel: f.financialYear.label,
        feeAmount: f.feeAmount.toString(),
        paid: p.toString(),
        pending: feePending(f.feeAmount, p, f.status).toString(),
        status: deriveStatus(f.feeAmount, p, f.status),
        memberId: f.memberId,
        memberName: f.member.fullName,
        memberNameEn: f.member.fullNameEn,
        memberCode: f.member.memberCode,
      };
    });
  });
}

export type YearCollection = {
  expected: string;
  collected: string;
  pending: string;
  percent: number;
  paidMembers: number;
  pendingMembers: number;
  totalFees: number;
};

export async function getYearCollection(
  financialYearId: string,
): Promise<YearCollection> {
  const rows = await listYearFees(financialYearId);
  let expected = new Prisma.Decimal(0);
  let collected = new Prisma.Decimal(0);
  let paidMembers = 0;
  let pendingMembers = 0;
  for (const r of rows) {
    expected = expected.plus(r.feeAmount);
    collected = collected.plus(r.paid);
    if (new Prisma.Decimal(r.pending).greaterThan(0)) pendingMembers++;
    else paidMembers++;
  }
  const pending = expected.minus(collected);
  const percent = expected.greaterThan(0)
    ? Math.round(collected.dividedBy(expected).times(100).toNumber())
    : 0;
  return {
    expected: expected.toString(),
    collected: collected.toString(),
    pending: pending.lessThan(0) ? "0" : pending.toString(),
    percent,
    paidMembers,
    pendingMembers,
    totalFees: rows.length,
  };
}

export async function listAssignableMembers(
  financialYearId: string,
): Promise<
  { id: string; fullName: string; fullNameEn: string | null; memberCode: string }[]
> {
  return withAction({ permission: "fee.assign" }, async () => {
    const assigned = await db.annualFee.findMany({
      where: { financialYearId },
      select: { memberId: true },
    });
    const have = new Set(assigned.map((a) => a.memberId));
    const members = await db.member.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, fullNameEn: true, memberCode: true },
      orderBy: { fullName: "asc" },
    });
    return members.filter((m) => !have.has(m.id));
  });
}

export type PendingDuesRow = {
  memberId: string;
  memberName: string;
  memberNameEn: string | null;
  memberCode: string;
  mobile: string | null;
  pendingYears: number;
  totalPending: string;
};

export async function listPendingDues(): Promise<PendingDuesRow[]> {
  return withAction({ permission: "fee.view" }, async () => {
    const fees = await db.annualFee.findMany({
      include: { financialYear: true, member: true },
    });
    const paid = await paidByFee(fees.map((f) => f.id));
    const byMember: Record<
      string,
      { m: (typeof fees)[number]["member"]; years: number; total: Prisma.Decimal }
    > = {};
    for (const f of fees) {
      const p = paid[f.id] ?? new Prisma.Decimal(0);
      const pend = feePending(f.feeAmount, p, f.status);
      if (pend.lessThanOrEqualTo(0)) continue;
      const entry =
        byMember[f.memberId] ??
        (byMember[f.memberId] = {
          m: f.member,
          years: 0,
          total: new Prisma.Decimal(0),
        });
      entry.years += 1;
      entry.total = entry.total.plus(pend);
    }
    return Object.values(byMember)
      .map((e) => ({
        memberId: e.m.id,
        memberName: e.m.fullName,
        memberNameEn: e.m.fullNameEn,
        memberCode: e.m.memberCode,
        mobile: e.m.mobile,
        pendingYears: e.years,
        totalPending: e.total.toString(),
      }))
      .sort((a, b) =>
        new Prisma.Decimal(b.totalPending)
          .minus(a.totalPending)
          .toNumber(),
      );
  });
}
