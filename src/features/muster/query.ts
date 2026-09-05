import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";
import { feePending, deriveStatus } from "@/lib/finance/calc";
import type { MusterCell, MusterData } from "./types";

/**
 * Load the full muster register: every financial year (columns) and every
 * member (rows, active AND inactive). Vargani cells are included only when
 * the caller may view fees; otherwise each member gets an empty cell map.
 */
export async function getMusterData(): Promise<MusterData> {
  return withAction({ permission: "member.view" }, async (ctx) => {
    const years = await db.financialYear.findMany({
      orderBy: { startDate: "asc" },
    });
    const members = await db.member.findMany({
      orderBy: { memberCode: "asc" },
      select: {
        id: true,
        memberCode: true,
        fullName: true,
        fullNameEn: true,
        mobile: true,
        whatsappNumber: true,
        isActive: true,
      },
    });

    const cellsByMember: Record<string, Record<string, MusterCell>> = {};
    if (ctx.user.permissions.includes("fee.view")) {
      const fees = await db.annualFee.findMany({
        select: {
          id: true,
          memberId: true,
          financialYearId: true,
          feeAmount: true,
          status: true,
        },
      });
      const allocs = await db.paymentAllocation.findMany({
        include: { payment: { select: { isVoided: true } } },
      });
      const paid: Record<string, Prisma.Decimal> = {};
      for (const a of allocs) {
        if (a.payment.isVoided) continue;
        paid[a.annualFeeId] = (paid[a.annualFeeId] ?? new Prisma.Decimal(0)).plus(
          a.amount,
        );
      }
      for (const f of fees) {
        const p = paid[f.id] ?? new Prisma.Decimal(0);
        const byYear = cellsByMember[f.memberId] ?? (cellsByMember[f.memberId] = {});
        byYear[f.financialYearId] = {
          feeAmount: f.feeAmount.toString(),
          paid: p.toString(),
          pending: feePending(f.feeAmount, p, f.status).toString(),
          status: deriveStatus(f.feeAmount, p, f.status),
        };
      }
    }

    return {
      years: years.map((y) => ({
        id: y.id,
        label: y.label,
        feeAmount: y.feeAmount.toString(),
      })),
      members: members.map((m) => ({
        id: m.id,
        memberCode: m.memberCode,
        fullName: m.fullName,
        fullNameEn: m.fullNameEn,
        mobile: m.mobile,
        whatsappNumber: m.whatsappNumber,
        isActive: m.isActive,
        cells: cellsByMember[m.id] ?? {},
      })),
    };
  });
}
