"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { nextReceiptNumber } from "@/lib/receiptnumber/generate";
import { feePending, deriveStatus, isManualZeroStatus } from "@/lib/finance/calc";

const paymentSchema = z.object({
  memberId: z.string().min(1),
  amount: z.string(),
  paymentModeId: z.string().min(1),
  referenceNumber: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  allocations: z.array(
    z.object({ annualFeeId: z.string(), amount: z.string() }),
  ),
});
export type RecordPaymentInput = z.infer<typeof paymentSchema>;

async function paidForFee(annualFeeId: string): Promise<Prisma.Decimal> {
  const allocs = await db.paymentAllocation.findMany({
    where: { annualFeeId },
    include: { payment: { select: { isVoided: true } } },
  });
  let paid = new Prisma.Decimal(0);
  for (const a of allocs) if (!a.payment.isVoided) paid = paid.plus(a.amount);
  return paid;
}

async function recomputeFeeStatus(annualFeeId: string): Promise<void> {
  const fee = await db.annualFee.findFirst({ where: { id: annualFeeId } });
  if (!fee) return;
  if (isManualZeroStatus(fee.status)) return; // preserve manual status
  const paid = await paidForFee(annualFeeId);
  const status = deriveStatus(fee.feeAmount, paid);
  if (status !== fee.status) {
    await db.annualFee.update({ where: { id: annualFeeId }, data: { status } });
  }
}

export async function recordPayment(input: RecordPaymentInput) {
  const data = paymentSchema.parse(input);
  const amount = new Prisma.Decimal(data.amount);
  return withAction({ permission: "payment.create" }, async (ctx) => {
    if (amount.lessThanOrEqualTo(0)) throw new Error("INVALID_AMOUNT");
    const member = await db.member.findFirst({ where: { id: data.memberId } });
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    const mode = await db.paymentMode.findFirst({
      where: { id: data.paymentModeId },
    });
    if (!mode) throw new Error("INVALID_MODE");

    const allocs = data.allocations
      .map((a) => ({
        annualFeeId: a.annualFeeId,
        amount: new Prisma.Decimal(a.amount),
      }))
      .filter((a) => a.amount.greaterThan(0));

    let allocTotal = new Prisma.Decimal(0);
    for (const a of allocs) {
      const fee = await db.annualFee.findFirst({
        where: { id: a.annualFeeId, memberId: data.memberId },
      });
      if (!fee) throw new Error("INVALID_ALLOCATION");
      const paid = await paidForFee(fee.id);
      const pend = feePending(fee.feeAmount, paid, fee.status);
      if (a.amount.greaterThan(pend)) {
        throw new Error("ALLOCATION_EXCEEDS_PENDING");
      }
      allocTotal = allocTotal.plus(a.amount);
    }
    if (allocTotal.greaterThan(amount)) {
      throw new Error("ALLOCATION_EXCEEDS_AMOUNT");
    }

    const payment = await db.payment.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: data.memberId,
        amount,
        paymentModeId: data.paymentModeId,
        referenceNumber: data.referenceNumber ?? null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        collectedBy: ctx.user.id,
        notes: data.notes ?? null,
      },
    });
    if (allocs.length) {
      await db.paymentAllocation.createMany({
        data: allocs.map((a) => ({
          organizationId: ctx.organizationId,
          paymentId: payment.id,
          annualFeeId: a.annualFeeId,
          amount: a.amount,
        })),
      });
      for (const a of allocs) await recomputeFeeStatus(a.annualFeeId);
    }
    const receiptNumber = await nextReceiptNumber(ctx.organizationId);
    const receipt = await db.receipt.create({
      data: {
        organizationId: ctx.organizationId,
        receiptNumber,
        paymentId: payment.id,
        memberId: data.memberId,
      },
    });
    await writeAudit({
      action: "create",
      module: "payments",
      recordType: "Payment",
      recordId: payment.id,
      newValue: { amount: amount.toString(), receiptNumber },
    });
    return { paymentId: payment.id, receiptId: receipt.id, receiptNumber };
  });
}

export async function voidPayment(id: string, reason?: string) {
  return withAction({ permission: "payment.void" }, async () => {
    const payment = await db.payment.findFirst({
      where: { id },
      include: { allocations: true },
    });
    if (!payment) throw new Error("NOT_FOUND");
    if (payment.isVoided) return;
    await db.payment.update({
      where: { id },
      data: { isVoided: true, voidedReason: reason ?? null },
    });
    for (const a of payment.allocations) await recomputeFeeStatus(a.annualFeeId);
    await writeAudit({
      action: "void",
      module: "payments",
      recordType: "Payment",
      recordId: id,
      newValue: { reason: reason ?? null },
    });
  });
}

export async function voidPaymentAction(id: string, reason?: string) {
  await voidPayment(id, reason);
}
