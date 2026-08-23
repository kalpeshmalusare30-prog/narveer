import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";

const D = (v: Prisma.Decimal | string | number | null | undefined) =>
  new Prisma.Decimal(v ?? 0);

export type CollectionRow = {
  label: string;
  expected: string;
  collected: string;
  pending: string;
  percent: number;
};

export async function collectionReport(): Promise<CollectionRow[]> {
  return withAction({ permission: "report.view" }, async () => {
    const years = await db.financialYear.findMany({
      orderBy: { startDate: "desc" },
    });
    const out: CollectionRow[] = [];
    for (const y of years) {
      const fees = await db.annualFee.findMany({
        where: { financialYearId: y.id },
        select: { id: true, feeAmount: true },
      });
      const expected = fees.reduce((s, f) => s.plus(f.feeAmount), D(0));
      const allocs = await db.paymentAllocation.findMany({
        where: { annualFeeId: { in: fees.map((f) => f.id) } },
        include: { payment: { select: { isVoided: true } } },
      });
      let collected = D(0);
      for (const a of allocs) if (!a.payment.isVoided) collected = collected.plus(a.amount);
      const pending = expected.minus(collected);
      out.push({
        label: y.label,
        expected: expected.toString(),
        collected: collected.toString(),
        pending: (pending.lessThan(0) ? D(0) : pending).toString(),
        percent: expected.greaterThan(0)
          ? Math.round(collected.dividedBy(expected).times(100).toNumber())
          : 0,
      });
    }
    return out;
  });
}

export type NameTotalRow = { name: string; total: string; count: number };

export async function paymentModeReport(): Promise<NameTotalRow[]> {
  return withAction({ permission: "report.view" }, async () => {
    const modes = await db.paymentMode.findMany({ orderBy: { name: "asc" } });
    const out: NameTotalRow[] = [];
    for (const m of modes) {
      const agg = await db.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { paymentModeId: m.id, isVoided: false },
      });
      out.push({
        name: m.name,
        total: D(agg._sum.amount).toString(),
        count: agg._count,
      });
    }
    return out.filter((r) => r.count > 0);
  });
}

export async function incomeByCategoryReport(): Promise<NameTotalRow[]> {
  return withAction({ permission: "report.view" }, async () => {
    const cats = await db.incomeCategory.findMany({ orderBy: { name: "asc" } });
    const out: NameTotalRow[] = [];
    for (const c of cats) {
      const agg = await db.income.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { incomeCategoryId: c.id, isVoided: false },
      });
      if (agg._count > 0)
        out.push({
          name: c.name,
          total: D(agg._sum.amount).toString(),
          count: agg._count,
        });
    }
    return out;
  });
}

export async function expenseByCategoryReport(): Promise<NameTotalRow[]> {
  return withAction({ permission: "report.view" }, async () => {
    const cats = await db.expenseCategory.findMany({ orderBy: { name: "asc" } });
    const out: NameTotalRow[] = [];
    for (const c of cats) {
      const agg = await db.expense.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { expenseCategoryId: c.id, isVoided: false },
      });
      if (agg._count > 0)
        out.push({
          name: c.name,
          total: D(agg._sum.amount).toString(),
          count: agg._count,
        });
    }
    return out;
  });
}

export async function whatsappReport(): Promise<NameTotalRow[]> {
  return withAction({ permission: "report.view" }, async () => {
    const grouped = await db.whatsAppMessage.groupBy({
      by: ["status"],
      _count: true,
    });
    return grouped.map((g) => ({
      name: g.status,
      total: String(g._count),
      count: g._count,
    }));
  });
}
