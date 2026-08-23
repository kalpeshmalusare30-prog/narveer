import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createFinancialYear } from "@/features/finance/year-actions";
import { assignFeeManual } from "@/features/finance/fee-actions";
import { listMemberFees, getMemberTotalPending } from "@/features/finance/fee-query";
import { recordPayment, voidPayment } from "./actions";

const PERMS = [
  "financialyear.view",
  "financialyear.manage",
  "fee.view",
  "fee.assign",
  "payment.view",
  "payment.create",
  "payment.void",
  "receipt.view",
];

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O", receiptNumberPrefix: "NTM" },
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
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: PERMS,
  });
  const fy1 = await createFinancialYear({ label: "2024-25", feeAmount: "1000" });
  const fy2 = await createFinancialYear({ label: "2025-26", feeAmount: "1000" });
  const fee1 = await assignFeeManual(fy1.id, member.id);
  const fee2 = await assignFeeManual(fy2.id, member.id);
  return { org, member, mode, fee1, fee2 };
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("split payment across two years updates pending and creates a receipt", async () => {
  const { member, mode, fee1, fee2 } = await setup();
  expect(await getMemberTotalPending(member.id)).toBe("2000");

  const res = await recordPayment({
    memberId: member.id,
    amount: "1500",
    paymentModeId: mode.id,
    allocations: [
      { annualFeeId: fee1.id, amount: "1000" },
      { annualFeeId: fee2.id, amount: "500" },
    ],
  });
  expect(res.receiptNumber).toBe("NTM0001");

  const rows = await listMemberFees(member.id);
  const r1 = rows.find((r) => r.id === fee1.id)!;
  const r2 = rows.find((r) => r.id === fee2.id)!;
  expect(r1.pending).toBe("0");
  expect(r1.status).toBe("Paid");
  expect(r2.pending).toBe("500");
  expect(r2.status).toBe("Partial");
  expect(await getMemberTotalPending(member.id)).toBe("500");
});

test("rejects allocation exceeding a fee's pending", async () => {
  const { member, mode, fee1 } = await setup();
  await expect(
    recordPayment({
      memberId: member.id,
      amount: "2000",
      paymentModeId: mode.id,
      allocations: [{ annualFeeId: fee1.id, amount: "1500" }],
    }),
  ).rejects.toThrow(/ALLOCATION_EXCEEDS_PENDING/);
});

test("rejects allocations exceeding the payment amount", async () => {
  const { member, mode, fee1, fee2 } = await setup();
  await expect(
    recordPayment({
      memberId: member.id,
      amount: "1000",
      paymentModeId: mode.id,
      allocations: [
        { annualFeeId: fee1.id, amount: "700" },
        { annualFeeId: fee2.id, amount: "700" },
      ],
    }),
  ).rejects.toThrow(/ALLOCATION_EXCEEDS_AMOUNT/);
});

test("voiding a payment restores pending and reverts status", async () => {
  const { member, mode, fee1 } = await setup();
  const res = await recordPayment({
    memberId: member.id,
    amount: "1000",
    paymentModeId: mode.id,
    allocations: [{ annualFeeId: fee1.id, amount: "1000" }],
  });
  expect(await getMemberTotalPending(member.id)).toBe("1000"); // fee2 still 1000
  await voidPayment(res.paymentId, "mistake");
  expect(await getMemberTotalPending(member.id)).toBe("2000"); // restored
  const rows = await listMemberFees(member.id);
  expect(rows.find((r) => r.id === fee1.id)!.status).toBe("Pending");
});
