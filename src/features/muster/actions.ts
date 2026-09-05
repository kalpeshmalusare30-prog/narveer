"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { feePending, deriveStatus, isManualZeroStatus } from "@/lib/finance/calc";
import { recordPayment } from "@/features/payments/actions";
import { createMember, voidMember } from "@/features/members/actions";
import type {
  MusterCell,
  MusterErr,
  MusterQuickAddResult,
  MusterSetPaidResult,
  MusterSimpleResult,
  MusterUpdateMemberResult,
} from "./types";

/** Map a thrown error onto the muster error vocabulary. */
function toMusterErr(e: unknown): MusterErr {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "FORBIDDEN" || msg === "UNAUTHENTICATED") return "FORBIDDEN";
  if (msg === "NOT_FOUND" || msg === "MEMBER_NOT_FOUND") return "NOT_FOUND";
  return "SAVE_FAILED";
}

/** Sum of allocations from non-voided payments for one annual fee. */
async function paidForFee(annualFeeId: string): Promise<Prisma.Decimal> {
  const allocs = await db.paymentAllocation.findMany({
    where: { annualFeeId },
    include: { payment: { select: { isVoided: true } } },
  });
  let paid = new Prisma.Decimal(0);
  for (const a of allocs) if (!a.payment.isVoided) paid = paid.plus(a.amount);
  return paid;
}

function toCell(
  feeAmount: Prisma.Decimal,
  paid: Prisma.Decimal,
  status: string,
): MusterCell {
  return {
    feeAmount: feeAmount.toString(),
    paid: paid.toString(),
    pending: feePending(feeAmount, paid, status).toString(),
    status: deriveStatus(feeAmount, paid, status),
  };
}

/**
 * Set the TOTAL paid for a member × year. Records a real payment (with
 * receipt) for the difference between the new total and what is already
 * paid — cash, dated today. Auto-assigns the year's fee if missing.
 */
export async function musterSetPaidAction(input: {
  memberId: string;
  financialYearId: string;
  totalPaid: string;
}): Promise<MusterSetPaidResult> {
  let total: Prisma.Decimal;
  try {
    total = new Prisma.Decimal(input.totalPaid.trim());
  } catch {
    return { ok: false, error: "INVALID_AMOUNT" };
  }
  if (total.isNaN() || total.isNegative()) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }
  try {
    return await withAction(
      { permission: "payment.create" },
      async (ctx): Promise<MusterSetPaidResult> => {
        const member = await db.member.findFirst({
          where: { id: input.memberId },
        });
        if (!member) return { ok: false, error: "NOT_FOUND" };

        let fee = await db.annualFee.findFirst({
          where: {
            memberId: input.memberId,
            financialYearId: input.financialYearId,
          },
        });
        if (!fee) {
          const year = await db.financialYear.findFirst({
            where: { id: input.financialYearId },
          });
          if (!year) return { ok: false, error: "NOT_FOUND" };
          fee = await db.annualFee.create({
            data: {
              organizationId: ctx.organizationId,
              memberId: input.memberId,
              financialYearId: input.financialYearId,
              feeAmount: year.feeAmount,
              status: "Pending",
              createdBy: ctx.user.id,
            },
          });
          await writeAudit({
            action: "create",
            module: "fees",
            recordType: "AnnualFee",
            recordId: fee.id,
            newValue: {
              memberId: input.memberId,
              financialYearId: input.financialYearId,
              feeAmount: fee.feeAmount.toString(),
            },
          });
        }

        if (isManualZeroStatus(fee.status)) {
          return { ok: false, error: "WAIVED" };
        }

        const paid = await paidForFee(fee.id);
        if (total.lessThan(paid)) return { ok: false, error: "LOWER_THAN_PAID" };
        if (total.greaterThan(fee.feeAmount)) {
          return { ok: false, error: "EXCEEDS_FEE" };
        }
        if (total.equals(paid)) {
          // No-op: the register already shows this total.
          return { ok: true, cell: toCell(fee.feeAmount, paid, fee.status) };
        }

        const delta = total.minus(paid);
        let mode = await db.paymentMode.findFirst({
          where: { name: { equals: "Cash", mode: "insensitive" } },
        });
        if (!mode) mode = await db.paymentMode.findFirst({ where: { isActive: true } });
        if (!mode) return { ok: false, error: "NO_PAYMENT_MODE" };

        const res = await recordPayment({
          memberId: input.memberId,
          amount: delta.toString(),
          paymentModeId: mode.id,
          allocations: [{ annualFeeId: fee.id, amount: delta.toString() }],
          notes: "Muster entry",
        });

        const updated = await db.annualFee.findFirst({ where: { id: fee.id } });
        const newPaid = await paidForFee(fee.id);
        const f = updated ?? fee;
        return {
          ok: true,
          cell: toCell(f.feeAmount, newPaid, f.status),
          receiptNumber: res.receiptNumber,
        };
      },
    );
  } catch (e) {
    return { ok: false, error: toMusterErr(e) };
  }
}

/** Inline-edit one of the muster's editable member fields. */
export async function musterUpdateMemberAction(input: {
  memberId: string;
  field: "fullName" | "fullNameEn" | "mobile";
  value: string;
}): Promise<MusterUpdateMemberResult> {
  const allowed = ["fullName", "fullNameEn", "mobile"];
  if (!allowed.includes(input.field)) return { ok: false, error: "SAVE_FAILED" };
  const trimmed = (input.value ?? "").trim();
  if (input.field === "fullName" && !trimmed) {
    return { ok: false, error: "NAME_REQUIRED" };
  }
  try {
    return await withAction(
      { permission: "member.edit" },
      async (ctx): Promise<MusterUpdateMemberResult> => {
        const existing = await db.member.findFirst({
          where: { id: input.memberId },
        });
        if (!existing) return { ok: false, error: "NOT_FOUND" };
        const value = input.field === "fullName" ? trimmed : trimmed || null;
        await db.member.update({
          where: { id: input.memberId },
          data: { [input.field]: value, updatedBy: ctx.user.id },
        });
        await writeAudit({
          action: "update",
          module: "members",
          recordType: "Member",
          recordId: input.memberId,
          oldValue: { [input.field]: existing[input.field] },
          newValue: { [input.field]: value },
        });
        return { ok: true };
      },
    );
  } catch (e) {
    return { ok: false, error: toMusterErr(e) };
  }
}

/** Quick-add a member from the register (name + optional English name/mobile). */
export async function musterQuickAddAction(input: {
  fullName: string;
  fullNameEn?: string | null;
  mobile?: string | null;
}): Promise<MusterQuickAddResult> {
  const fullName = (input.fullName ?? "").trim();
  if (!fullName) return { ok: false, error: "NAME_REQUIRED" };
  try {
    return await withAction(
      { permission: "member.create" },
      async (): Promise<MusterQuickAddResult> => {
        let status = await db.memberStatus.findFirst({
          where: { name: "Active" },
        });
        if (!status) status = await db.memberStatus.findFirst({});
        if (!status) throw new Error("SAVE_FAILED");

        const mobile = input.mobile?.trim() ? input.mobile.trim() : null;
        const member = await createMember({
          fullName,
          mobile,
          statusId: status.id,
        });

        // memberInput has no fullNameEn field, so set it via a follow-up update.
        const fullNameEn = input.fullNameEn?.trim() ? input.fullNameEn.trim() : null;
        const final = fullNameEn
          ? await db.member.update({
              where: { id: member.id },
              data: { fullNameEn },
            })
          : member;

        return {
          ok: true,
          member: {
            id: final.id,
            memberCode: final.memberCode,
            fullName: final.fullName,
            fullNameEn: final.fullNameEn,
            mobile: final.mobile,
            isActive: final.isActive,
            cells: {},
          },
        };
      },
    );
  } catch (e) {
    return { ok: false, error: toMusterErr(e) };
  }
}

/** Soft-delete (deactivate) a member. Delegates to voidMember, which audits. */
export async function musterDeactivateAction(
  memberId: string,
): Promise<MusterSimpleResult> {
  try {
    await voidMember(memberId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMusterErr(e) };
  }
}

/** Restore a previously deactivated member. */
export async function musterRestoreAction(
  memberId: string,
): Promise<MusterSimpleResult> {
  try {
    return await withAction(
      { permission: "member.void" },
      async (ctx): Promise<MusterSimpleResult> => {
        const existing = await db.member.findFirst({ where: { id: memberId } });
        if (!existing) return { ok: false, error: "NOT_FOUND" };
        await db.member.update({
          where: { id: memberId },
          data: { isActive: true, updatedBy: ctx.user.id },
        });
        await writeAudit({
          action: "update",
          module: "members",
          recordType: "Member",
          recordId: memberId,
          oldValue: { isActive: false },
          newValue: { isActive: true },
        });
        return { ok: true };
      },
    );
  } catch (e) {
    return { ok: false, error: toMusterErr(e) };
  }
}
