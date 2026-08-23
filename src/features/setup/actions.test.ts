import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { saveFinancialConfig, completeSetup } from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

async function orgAdmin() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: ["settings.org.manage"],
  });
  return org;
}

test("saves financial config as Decimal", async () => {
  const org = await orgAdmin();
  await saveFinancialConfig({
    financialYearStart: 4,
    financialYearEnd: 3,
    defaultMembershipFee: "1000",
    receiptNumberPrefix: "NTM",
    memberCodePrefix: "NTM",
  });
  const after = await testDb.organization.findUnique({ where: { id: org.id } });
  expect(after?.defaultMembershipFee.toString()).toBe("1000");
  expect(after?.memberCodePrefix).toBe("NTM");
});

test("rejects a negative fee", async () => {
  await orgAdmin();
  await expect(
    saveFinancialConfig({
      financialYearStart: 4,
      financialYearEnd: 3,
      defaultMembershipFee: "-5",
      receiptNumberPrefix: "X",
      memberCodePrefix: "X",
    }),
  ).rejects.toThrow();
});

test("completeSetup marks the org", async () => {
  const org = await orgAdmin();
  await completeSetup();
  const after = await testDb.organization.findUnique({ where: { id: org.id } });
  expect(after?.setupCompleted).toBe(true);
});
