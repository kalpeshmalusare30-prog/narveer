"use server";

import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";

export async function assignFeeToAllActive(financialYearId: string) {
  return withAction({ permission: "fee.assign" }, async (ctx) => {
    const year = await db.financialYear.findFirst({
      where: { id: financialYearId },
    });
    if (!year) throw new Error("NOT_FOUND");
    const members = await db.member.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const existing = await db.annualFee.findMany({
      where: { financialYearId },
      select: { memberId: true },
    });
    const have = new Set(existing.map((e) => e.memberId));
    const toCreate = members.map((m) => m.id).filter((id) => !have.has(id));
    if (toCreate.length) {
      await db.annualFee.createMany({
        data: toCreate.map((memberId) => ({
          organizationId: ctx.organizationId,
          memberId,
          financialYearId,
          feeAmount: year.feeAmount,
          createdBy: ctx.user.id,
        })),
      });
      await writeAudit({
        action: "assign_all",
        module: "fees",
        recordType: "FinancialYear",
        recordId: financialYearId,
        newValue: { created: toCreate.length },
      });
    }
    return { created: toCreate.length };
  });
}

export async function assignFeeToMembers(
  financialYearId: string,
  memberIds: string[],
) {
  return withAction({ permission: "fee.assign" }, async (ctx) => {
    const year = await db.financialYear.findFirst({
      where: { id: financialYearId },
    });
    if (!year) throw new Error("NOT_FOUND");
    const members = await db.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });
    const valid = new Set(members.map((m) => m.id));
    const existing = await db.annualFee.findMany({
      where: { financialYearId, memberId: { in: memberIds } },
      select: { memberId: true },
    });
    const have = new Set(existing.map((e) => e.memberId));
    const toCreate = memberIds.filter((id) => valid.has(id) && !have.has(id));
    if (toCreate.length) {
      await db.annualFee.createMany({
        data: toCreate.map((memberId) => ({
          organizationId: ctx.organizationId,
          memberId,
          financialYearId,
          feeAmount: year.feeAmount,
          createdBy: ctx.user.id,
        })),
      });
      await writeAudit({
        action: "assign_bulk",
        module: "fees",
        recordType: "FinancialYear",
        recordId: financialYearId,
        newValue: { created: toCreate.length },
      });
    }
    return { created: toCreate.length };
  });
}

export async function assignFeeManual(
  financialYearId: string,
  memberId: string,
) {
  return withAction({ permission: "fee.assign" }, async (ctx) => {
    const year = await db.financialYear.findFirst({
      where: { id: financialYearId },
    });
    if (!year) throw new Error("NOT_FOUND");
    const member = await db.member.findFirst({ where: { id: memberId } });
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    const dup = await db.annualFee.findFirst({
      where: { financialYearId, memberId },
    });
    if (dup) throw new Error("DUPLICATE");
    const fee = await db.annualFee.create({
      data: {
        organizationId: ctx.organizationId,
        memberId,
        financialYearId,
        feeAmount: year.feeAmount,
        createdBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "assign",
      module: "fees",
      recordType: "AnnualFee",
      recordId: fee.id,
    });
    return fee;
  });
}

export async function setFeeStatus(annualFeeId: string, status: string) {
  const allowed = ["Pending", "Waived", "Exempted", "Cancelled"];
  if (!allowed.includes(status)) throw new Error("INVALID_STATUS");
  return withAction({ permission: "fee.waive" }, async () => {
    const fee = await db.annualFee.findFirst({ where: { id: annualFeeId } });
    if (!fee) throw new Error("NOT_FOUND");
    await db.annualFee.update({
      where: { id: annualFeeId },
      data: { status },
    });
    await writeAudit({
      action: "set_status",
      module: "fees",
      recordType: "AnnualFee",
      recordId: annualFeeId,
      oldValue: { status: fee.status },
      newValue: { status },
    });
  });
}

// --- Client adapters ---
export async function assignAllAction(financialYearId: string) {
  return assignFeeToAllActive(financialYearId);
}
export async function assignMembersAction(
  financialYearId: string,
  memberIds: string[],
) {
  return assignFeeToMembers(financialYearId, memberIds);
}
export async function setFeeStatusAction(annualFeeId: string, status: string) {
  await setFeeStatus(annualFeeId, status);
}
