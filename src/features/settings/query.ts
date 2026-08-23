import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listMembershipTypes() {
  return withAction(
    { permission: "settings.membership_type.manage" },
    async () => db.membershipType.findMany({ orderBy: { name: "asc" } }),
  );
}

export async function listMemberStatuses() {
  return withAction({ permission: "settings.member_status.manage" }, async () =>
    db.memberStatus.findMany({ orderBy: { name: "asc" } }),
  );
}

export async function listPaymentModes() {
  return withAction({ permission: "settings.payment_mode.manage" }, async () =>
    db.paymentMode.findMany({ orderBy: { name: "asc" } }),
  );
}

export async function listIncomeCategories() {
  return withAction(
    { permission: "settings.income_category.manage" },
    async () => db.incomeCategory.findMany({ orderBy: { name: "asc" } }),
  );
}

export async function listExpenseCategories() {
  return withAction(
    { permission: "settings.expense_category.manage" },
    async () => db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  );
}
