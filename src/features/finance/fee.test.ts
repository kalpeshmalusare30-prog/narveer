import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createFinancialYear } from "./year-actions";
import {
  assignFeeToAllActive,
  assignFeeManual,
  setFeeStatus,
} from "./fee-actions";
import { listMemberFees, getMemberTotalPending } from "./fee-query";

const PERMS = [
  "financialyear.view",
  "financialyear.manage",
  "fee.view",
  "fee.assign",
  "fee.waive",
];

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O", financialYearStart: 4, financialYearEnd: 3 },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  const m1 = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M1",
      fullName: "A",
      mobile: "1",
      statusId: status.id,
    },
  });
  const m2 = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M2",
      fullName: "B",
      mobile: "2",
      statusId: status.id,
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: PERMS,
  });
  return { org, m1, m2 };
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("create FY, assign to all active, prevent duplicates", async () => {
  const { org } = await setup();
  const fy = await createFinancialYear({ label: "2024-25", feeAmount: "1000" });
  expect(fy.feeAmount.toString()).toBe("1000");
  expect(fy.organizationId).toBe(org.id);

  const first = await assignFeeToAllActive(fy.id);
  expect(first.created).toBe(2);
  const again = await assignFeeToAllActive(fy.id);
  expect(again.created).toBe(0); // no duplicates

  await expect(
    createFinancialYear({ label: "2024-25", feeAmount: "1200" }),
  ).rejects.toThrow(/DUPLICATE/);
});

test("fee amount is snapshotted (later FY fee change does not rewrite history)", async () => {
  const { m1 } = await setup();
  const fy = await createFinancialYear({ label: "2025-26", feeAmount: "1000" });
  await assignFeeManual(fy.id, m1.id);
  // change the FY fee afterwards
  await testDb.financialYear.update({
    where: { id: fy.id },
    data: { feeAmount: "1500" },
  });
  const rows = await listMemberFees(m1.id);
  expect(rows).toHaveLength(1);
  expect(rows[0].feeAmount).toBe("1000"); // snapshot unchanged
});

test("waive zeroes pending", async () => {
  const { m1 } = await setup();
  const fy = await createFinancialYear({ label: "2026-27", feeAmount: "1200" });
  const fee = await assignFeeManual(fy.id, m1.id);
  expect(await getMemberTotalPending(m1.id)).toBe("1200");
  await setFeeStatus(fee.id, "Waived");
  expect(await getMemberTotalPending(m1.id)).toBe("0");
});
