"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction, type ActionContext } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { getProvider, renderTemplate } from "@/lib/whatsapp";
import { feePending } from "@/lib/finance/calc";
import { formatINR } from "@/lib/money/money";
import { notify } from "@/lib/notify/notify";

async function getTemplateBody(type: string): Promise<string | null> {
  const tpl = await db.whatsAppTemplate.findFirst({
    where: { type, isActive: true },
  });
  return tpl?.body ?? null;
}

async function memberPending(memberId: string) {
  const fees = await db.annualFee.findMany({
    where: { memberId },
    include: { financialYear: true, allocations: { include: { payment: true } } },
  });
  let total = new Prisma.Decimal(0);
  const pendingYears: string[] = [];
  for (const f of fees) {
    let paid = new Prisma.Decimal(0);
    for (const a of f.allocations) {
      if (!a.payment.isVoided) paid = paid.plus(a.amount);
    }
    const pend = feePending(f.feeAmount, paid, f.status);
    if (pend.greaterThan(0)) {
      total = total.plus(pend);
      pendingYears.push(f.financialYear.label);
    }
  }
  return { total, pendingYears };
}

type Related = {
  relatedPaymentId?: string;
  relatedReceiptId?: string;
  relatedAnnualFeeId?: string;
};

/** Core: render, record, and (if configured) send a message. */
async function recordAndSend(
  ctx: ActionContext,
  input: {
    memberId: string | null;
    toNumber: string;
    type: string;
    content: string;
    related?: Related;
  },
) {
  const org = await rawDb.organization.findUnique({
    where: { id: ctx.organizationId },
  });
  const provider = org ? getProvider(org) : null;

  let status = "Pending";
  let failureReason: string | null = null;
  let providerMessageId: string | null = null;
  let sentAt: Date | null = null;

  if (!input.toNumber) {
    status = "Failed";
    failureReason = "no_number";
  } else if (!provider) {
    status = "Pending";
    failureReason = "not_configured";
  } else {
    const r = await provider.send(input.toNumber, input.content);
    if (r.ok) {
      status = "Sent";
      providerMessageId = r.providerMessageId ?? null;
      sentAt = new Date();
    } else {
      status = "Failed";
      failureReason = r.error ?? "send_failed";
    }
  }

  const msg = await db.whatsAppMessage.create({
    data: {
      organizationId: ctx.organizationId,
      memberId: input.memberId,
      type: input.type,
      toNumber: input.toNumber,
      content: input.content,
      status,
      failureReason,
      providerMessageId,
      sentByUserId: ctx.user.id,
      sentAt,
      ...(input.related ?? {}),
    },
  });
  await writeAudit({
    action: "send",
    module: "whatsapp",
    recordType: "WhatsAppMessage",
    recordId: msg.id,
    newValue: { type: input.type, status },
  });
  if (status === "Failed") {
    await notify(
      "whatsapp_failed",
      `WhatsApp ${input.type} to ${input.toNumber} failed: ${failureReason ?? "error"}`,
    );
  }
  return { id: msg.id, status, failureReason, configured: !!provider };
}

export async function sendPendingReminder(memberId: string) {
  return withAction({ permission: "whatsapp.send" }, async (ctx) => {
    const member = await db.member.findFirst({ where: { id: memberId } });
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    const { total, pendingYears } = await memberPending(memberId);
    const body =
      (await getTemplateBody("reminder")) ??
      "नमस्कार {{memberName}}, आपली थकबाकी ₹{{totalPending}} आहे. {{organizationName}}";
    const content = renderTemplate(body, {
      memberName: member.fullName,
      organizationName: org?.nameMr?.trim() || org?.name || "",
      financialYear: pendingYears.join(", "),
      pendingAmount: formatINR(total.toString()),
      totalPending: formatINR(total.toString()),
      contactNumber: org?.contactNumber ?? "",
    });
    return recordAndSend(ctx, {
      memberId,
      toNumber: member.whatsappNumber || member.mobile || "",
      type: "reminder",
      content,
    });
  });
}

export async function sendPaymentConfirmation(paymentId: string) {
  return withAction({ permission: "whatsapp.send" }, async (ctx) => {
    const payment = await db.payment.findFirst({
      where: { id: paymentId },
      include: {
        member: true,
        receipt: true,
        allocations: { include: { annualFee: { include: { financialYear: true } } } },
      },
    });
    if (!payment) throw new Error("NOT_FOUND");
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    const years = payment.allocations
      .map((a) => a.annualFee.financialYear.label)
      .join(", ");
    const body =
      (await getTemplateBody("confirmation")) ??
      "नमस्कार {{memberName}}, ₹{{amount}} जमा झाली. पावती {{receiptNumber}}. {{organizationName}}";
    const content = renderTemplate(body, {
      memberName: payment.member.fullName,
      organizationName: org?.nameMr?.trim() || org?.name || "",
      financialYear: years,
      amount: formatINR(payment.amount.toString()),
      receiptNumber: payment.receipt?.receiptNumber ?? "",
    });
    return recordAndSend(ctx, {
      memberId: payment.memberId,
      toNumber: payment.member.whatsappNumber || payment.member.mobile || "",
      type: "confirmation",
      content,
      related: {
        relatedPaymentId: payment.id,
        relatedReceiptId: payment.receipt?.id,
      },
    });
  });
}

export async function shareReceipt(receiptId: string) {
  return withAction({ permission: "whatsapp.send" }, async (ctx) => {
    const receipt = await db.receipt.findFirst({
      where: { id: receiptId },
      include: { member: true, payment: true },
    });
    if (!receipt) throw new Error("NOT_FOUND");
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    const body =
      (await getTemplateBody("receipt")) ??
      "नमस्कार {{memberName}}, पावती {{receiptNumber}} ({{amount}}). {{organizationName}}";
    const content = renderTemplate(body, {
      memberName: receipt.member.fullName,
      organizationName: org?.nameMr?.trim() || org?.name || "",
      receiptNumber: receipt.receiptNumber,
      amount: formatINR(receipt.payment.amount.toString()),
    });
    return recordAndSend(ctx, {
      memberId: receipt.memberId,
      toNumber: receipt.member.whatsappNumber || receipt.member.mobile || "",
      type: "receipt",
      content,
      related: { relatedReceiptId: receipt.id, relatedPaymentId: receipt.paymentId },
    });
  });
}

export async function sendBulkReminders(memberIds: string[]) {
  return withAction({ permission: "whatsapp.send" }, async () => {
    let sent = 0;
    let queued = 0;
    let failed = 0;
    for (const id of memberIds) {
      try {
        const r = await sendPendingReminder(id);
        if (r.status === "Sent") sent++;
        else if (r.status === "Failed") failed++;
        else queued++;
      } catch {
        failed++;
      }
    }
    return { sent, queued, failed, total: memberIds.length };
  });
}

export async function sendThankYou(memberId: string) {
  return withAction({ permission: "whatsapp.send" }, async (ctx) => {
    const member = await db.member.findFirst({ where: { id: memberId } });
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    const body =
      (await getTemplateBody("thankyou")) ??
      "नमस्कार {{memberName}}, आपल्या सहकार्याबद्दल धन्यवाद. {{organizationName}}";
    const content = renderTemplate(body, {
      memberName: member.fullName,
      organizationName: org?.nameMr?.trim() || org?.name || "",
      contactNumber: org?.contactNumber ?? "",
    });
    return recordAndSend(ctx, {
      memberId,
      toNumber: member.whatsappNumber || member.mobile || "",
      type: "thankyou",
      content,
    });
  });
}

// --- client adapters ---
export async function sendReminderAction(memberId: string) {
  return sendPendingReminder(memberId);
}
export async function sendThankYouAction(memberId: string) {
  return sendThankYou(memberId);
}
export async function sendConfirmationAction(paymentId: string) {
  return sendPaymentConfirmation(paymentId);
}
export async function shareReceiptAction(receiptId: string) {
  return shareReceipt(receiptId);
}
export async function sendBulkRemindersAction(memberIds: string[]) {
  return sendBulkReminders(memberIds);
}
