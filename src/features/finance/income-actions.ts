"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { parseAmount } from "@/lib/money/money";

const incomeInput = z.object({
  amount: z.string(),
  incomeDate: z.string().optional().nullable(),
  incomeCategoryId: z.string().optional().nullable(),
  receivedFrom: z.string().optional().nullable(),
  paymentModeId: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type IncomeInput = z.infer<typeof incomeInput>;

export async function createIncome(input: IncomeInput) {
  const data = incomeInput.parse(input);
  const amount = parseAmount(data.amount); // throws on invalid/negative
  return withAction({ permission: "income.create" }, async (ctx) => {
    const income = await db.income.create({
      data: {
        organizationId: ctx.organizationId,
        amount,
        incomeDate: data.incomeDate ? new Date(data.incomeDate) : new Date(),
        incomeCategoryId: data.incomeCategoryId || null,
        receivedFrom: data.receivedFrom ?? null,
        paymentModeId: data.paymentModeId || null,
        referenceNumber: data.referenceNumber ?? null,
        notes: data.notes ?? null,
        createdBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "create",
      module: "income",
      recordType: "Income",
      recordId: income.id,
      newValue: { amount: amount.toString() },
    });
    return income;
  });
}

export async function voidIncome(id: string) {
  return withAction({ permission: "income.void" }, async () => {
    const existing = await db.income.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    await db.income.update({ where: { id }, data: { isVoided: true } });
    await writeAudit({
      action: "void",
      module: "income",
      recordType: "Income",
      recordId: id,
    });
  });
}

export type SaveState = { error?: string; success?: boolean };

export async function createIncomeForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const s = (k: string) => (formData.get(k) ?? "").toString();
  try {
    await createIncome({
      amount: s("amount"),
      incomeDate: s("incomeDate") || null,
      incomeCategoryId: s("incomeCategoryId") || null,
      receivedFrom: s("receivedFrom") || null,
      paymentModeId: s("paymentModeId") || null,
      referenceNumber: s("referenceNumber") || null,
      notes: s("notes") || null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function voidIncomeAction(id: string) {
  await voidIncome(id);
}
