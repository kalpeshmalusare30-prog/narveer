"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { formatINR, parseAmount } from "@/lib/money/money";
import { notify } from "@/lib/notify/notify";

const expenseInput = z.object({
  amount: z.string(),
  expenseDate: z.string().optional().nullable(),
  expenseCategoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  paidTo: z.string().optional().nullable(),
  billNumber: z.string().optional().nullable(),
  paymentModeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type ExpenseInput = z.infer<typeof expenseInput>;

export async function createExpense(input: ExpenseInput) {
  const data = expenseInput.parse(input);
  const amount = parseAmount(data.amount);
  return withAction({ permission: "expense.create" }, async (ctx) => {
    const expense = await db.expense.create({
      data: {
        organizationId: ctx.organizationId,
        amount,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        expenseCategoryId: data.expenseCategoryId || null,
        description: data.description ?? null,
        paidTo: data.paidTo ?? null,
        billNumber: data.billNumber ?? null,
        paymentModeId: data.paymentModeId || null,
        notes: data.notes ?? null,
        createdBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "create",
      module: "expense",
      recordType: "Expense",
      recordId: expense.id,
      newValue: { amount: amount.toString() },
    });
    await notify(
      "expense",
      `Expense of ${formatINR(amount.toString())} recorded${data.paidTo ? ` (${data.paidTo})` : ""}`,
    );
    return expense;
  });
}

export async function voidExpense(id: string) {
  return withAction({ permission: "expense.void" }, async () => {
    const existing = await db.expense.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    await db.expense.update({ where: { id }, data: { isVoided: true } });
    await writeAudit({
      action: "void",
      module: "expense",
      recordType: "Expense",
      recordId: id,
    });
  });
}

export type SaveState = { error?: string; success?: boolean };

export async function createExpenseForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const s = (k: string) => (formData.get(k) ?? "").toString();
  try {
    await createExpense({
      amount: s("amount"),
      expenseDate: s("expenseDate") || null,
      expenseCategoryId: s("expenseCategoryId") || null,
      description: s("description") || null,
      paidTo: s("paidTo") || null,
      billNumber: s("billNumber") || null,
      paymentModeId: s("paymentModeId") || null,
      notes: s("notes") || null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function voidExpenseAction(id: string) {
  await voidExpense(id);
}
