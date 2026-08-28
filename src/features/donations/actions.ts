"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { parseAmount } from "@/lib/money/money";

const donationSchema = z.object({
  donorName: z.string().min(1),
  kind: z.enum(["Donation", "Sponsorship"]),
  amount: z.string(),
  donationDate: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  paymentModeId: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type DonationInput = z.infer<typeof donationSchema>;

export type SaveState = { error?: string; success?: boolean };

export async function createDonation(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const s = (k: string) => (formData.get(k) ?? "").toString();
  const parsed = donationSchema.safeParse({
    donorName: s("donorName"),
    kind: s("kind") || "Donation",
    amount: s("amount"),
    donationDate: s("donationDate") || null,
    memberId: s("memberId") || null,
    paymentModeId: s("paymentModeId") || null,
    purpose: s("purpose") || null,
    referenceNumber: s("referenceNumber") || null,
    receiptNumber: s("receiptNumber") || null,
    notes: s("notes") || null,
  });
  if (!parsed.success) return { error: "createFailed" };
  const data = parsed.data;

  let amount;
  try {
    amount = parseAmount(data.amount);
  } catch {
    return { error: "createFailed" };
  }
  if (amount.lessThanOrEqualTo(0)) return { error: "createFailed" };

  try {
    await withAction({ permission: "donation.create" }, async (ctx) => {
      if (data.memberId) {
        const member = await db.member.findFirst({
          where: { id: data.memberId! },
        });
        if (!member) throw new Error("MEMBER_NOT_FOUND");
      }
      if (data.paymentModeId) {
        const mode = await db.paymentMode.findFirst({
          where: { id: data.paymentModeId! },
        });
        if (!mode) throw new Error("INVALID_MODE");
      }
      const donation = await db.donation.create({
        data: {
          organizationId: ctx.organizationId,
          donorName: data.donorName,
          kind: data.kind,
          amount,
          donationDate: data.donationDate
            ? new Date(data.donationDate)
            : new Date(),
          memberId: data.memberId || null,
          paymentModeId: data.paymentModeId || null,
          purpose: data.purpose ?? null,
          referenceNumber: data.referenceNumber ?? null,
          receiptNumber: data.receiptNumber ?? null,
          notes: data.notes ?? null,
          createdBy: ctx.user.id,
        },
      });
      await writeAudit({
        action: "create",
        module: "donations",
        recordType: "Donation",
        recordId: donation.id,
        newValue: {
          amount: amount.toString(),
          donorName: data.donorName,
          kind: data.kind,
        },
      });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/donations");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function voidDonation(id: string) {
  return withAction({ permission: "donation.void" }, async () => {
    const existing = await db.donation.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    if (existing.isVoided) return;
    await db.donation.update({
      where: { id },
      data: { isVoided: true },
    });
    await writeAudit({
      action: "void",
      module: "donations",
      recordType: "Donation",
      recordId: id,
    });
    revalidatePath("/donations");
    revalidatePath("/dashboard");
  });
}
