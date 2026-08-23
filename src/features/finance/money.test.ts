import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createIncome, voidIncome } from "./income-actions";
import { createExpense } from "./expense-actions";
import { getFinancialSummary, listIncome } from "./money-query";

const PERMS = [
  "income.view",
  "income.create",
  "income.void",
  "expense.view",
  "expense.create",
  "expense.void",
];

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  const member = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M1",
      fullName: "A",
      mobile: "1",
      statusId: status.id,
    },
  });
  const mode = await testDb.paymentMode.create({
    data: { organizationId: org.id, name: "Cash" },
  });
  // A membership payment (counts as membership collection)
  await testDb.payment.create({
    data: {
      organizationId: org.id,
      memberId: member.id,
      amount: "1000",
      paymentModeId: mode.id,
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: PERMS,
  });
  return { org };
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("financial summary combines membership collection, income and expense", async () => {
  await setup();
  await createIncome({ amount: "500", receivedFrom: "Donor" });
  await createExpense({ amount: "300", description: "Venue" });

  const s = await getFinancialSummary();
  expect(s.membershipCollection).toBe("1000");
  expect(s.otherIncome).toBe("500");
  expect(s.totalIncome).toBe("1500");
  expect(s.totalExpense).toBe("300");
  expect(s.balance).toBe("1200");
});

test("voided income is excluded from the balance", async () => {
  await setup();
  const inc = await createIncome({ amount: "500" });
  await createExpense({ amount: "300" });
  await voidIncome(inc.id);
  const s = await getFinancialSummary();
  expect(s.otherIncome).toBe("0");
  expect(s.balance).toBe("700"); // 1000 - 300
});

test("negative amounts are rejected", async () => {
  await setup();
  await expect(createIncome({ amount: "-5" })).rejects.toThrow();
  await expect(createExpense({ amount: "abc" })).rejects.toThrow();
});

test("income is tenant-scoped", async () => {
  const { org } = await setup();
  await createIncome({ amount: "500" });
  const other = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  await testDb.income.create({
    data: { organizationId: other.id, amount: "999" },
  });
  const rows = await listIncome();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBe(org.id);
});
