import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";

export async function listIncome() {
  return withAction({ permission: "income.view" }, async () =>
    db.income.findMany({
      include: { incomeCategory: true, paymentMode: true },
      orderBy: { incomeDate: "desc" },
    }),
  );
}

export async function listExpenses() {
  return withAction({ permission: "expense.view" }, async () =>
    db.expense.findMany({
      include: { expenseCategory: true, paymentMode: true },
      orderBy: { expenseDate: "desc" },
    }),
  );
}

export async function getIncomeFormData() {
  return withAction({ permission: "income.create" }, async () => {
    const [categories, modes] = await Promise.all([
      db.incomeCategory.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.paymentMode.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { categories, modes };
  });
}

export async function getExpenseFormData() {
  return withAction({ permission: "expense.create" }, async () => {
    const [categories, modes] = await Promise.all([
      db.expenseCategory.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.paymentMode.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { categories, modes };
  });
}

export type FinancialSummary = {
  membershipCollection: string;
  otherIncome: string;
  totalIncome: string;
  totalExpense: string;
  balance: string;
};

export async function getFinancialSummary(): Promise<FinancialSummary> {
  return withAction({ permission: "income.view" }, async () => {
    const [pay, inc, exp] = await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        where: { isVoided: false },
      }),
      db.income.aggregate({
        _sum: { amount: true },
        where: { isVoided: false },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: { isVoided: false },
      }),
    ]);
    const membershipCollection = new Prisma.Decimal(
      pay._sum.amount ?? 0,
    );
    const otherIncome = new Prisma.Decimal(inc._sum.amount ?? 0);
    const totalExpense = new Prisma.Decimal(exp._sum.amount ?? 0);
    const totalIncome = membershipCollection.plus(otherIncome);
    const balance = totalIncome.minus(totalExpense);
    return {
      membershipCollection: membershipCollection.toString(),
      otherIncome: otherIncome.toString(),
      totalIncome: totalIncome.toString(),
      totalExpense: totalExpense.toString(),
      balance: balance.toString(),
    };
  });
}
