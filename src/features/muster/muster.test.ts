import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";

// Server actions in the payments/members chain may touch Next's request
// context (revalidatePath); mock next/cache before importing the actions.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
import {
  musterSetPaidAction,
  musterUpdateMemberAction,
  musterQuickAddAction,
  musterDeactivateAction,
  musterRestoreAction,
} from "./actions";
import { getMusterData } from "./query";

const PERMS = [
  "member.view",
  "member.create",
  "member.edit",
  "member.void",
  "fee.view",
  "payment.create",
];

async function setup(perms: string[] = PERMS) {
  const org = await testDb.organization.create({
    data: {
      name: "O",
      shortName: "O",
      receiptNumberPrefix: "NTM",
      memberCodePrefix: "NTM",
    },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  const member = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M1",
      fullName: "अ",
      mobile: "1",
      statusId: status.id,
    },
  });
  const mode = await testDb.paymentMode.create({
    data: { organizationId: org.id, name: "Cash" },
  });
  const year = await testDb.financialYear.create({
    data: {
      organizationId: org.id,
      label: "2025-26",
      feeAmount: "500",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: perms,
  });
  return { org, status, member, mode, year };
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("setPaid with no fee row auto-assigns the year fee, pays, receipts", async () => {
  const { member, year } = await setup();
  const res = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "500",
  });
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  expect(res.cell).toEqual({
    feeAmount: "500",
    paid: "500",
    pending: "0",
    status: "Paid",
  });
  expect(res.receiptNumber).toBe("NTM0001");

  const fee = await testDb.annualFee.findFirst({
    where: { memberId: member.id, financialYearId: year.id },
  });
  expect(fee).not.toBeNull();
  expect(fee!.feeAmount.toString()).toBe("500");
  expect(fee!.status).toBe("Paid");
  const payments = await testDb.payment.findMany({
    where: { memberId: member.id },
  });
  expect(payments).toHaveLength(1);
  expect(payments[0].amount.toString()).toBe("500");
  const receipts = await testDb.receipt.findMany({
    where: { memberId: member.id },
  });
  expect(receipts).toHaveLength(1);
});

test("partial then top-up creates two payments for the difference", async () => {
  const { member, year } = await setup();
  const first = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "300",
  });
  expect(first.ok).toBe(true);
  if (first.ok) expect(first.cell.status).toBe("Partial");

  // Same total again is a no-op (no extra payment).
  const same = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "300",
  });
  expect(same.ok).toBe(true);
  if (same.ok) expect(same.receiptNumber).toBeUndefined();

  const second = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "500",
  });
  expect(second.ok).toBe(true);
  if (second.ok) {
    expect(second.cell.paid).toBe("500");
    expect(second.cell.status).toBe("Paid");
  }
  const payments = await testDb.payment.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "asc" },
  });
  expect(payments.map((p) => p.amount.toString())).toEqual(["300", "200"]);
});

test("setPaid rejects a total lower than what is already paid", async () => {
  const { member, year } = await setup();
  await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "300",
  });
  const res = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "200",
  });
  expect(res).toEqual({ ok: false, error: "LOWER_THAN_PAID" });
});

test("setPaid rejects a total above the fee amount", async () => {
  const { member, year } = await setup();
  const res = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "600",
  });
  expect(res).toEqual({ ok: false, error: "EXCEEDS_FEE" });
});

test("setPaid on a waived fee is rejected", async () => {
  const { org, member, year } = await setup();
  await testDb.annualFee.create({
    data: {
      organizationId: org.id,
      memberId: member.id,
      financialYearId: year.id,
      feeAmount: "500",
      status: "Waived",
    },
  });
  const res = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "100",
  });
  expect(res).toEqual({ ok: false, error: "WAIVED" });
});

test("setPaid rejects non-numeric and negative amounts", async () => {
  const { member, year } = await setup();
  expect(
    await musterSetPaidAction({
      memberId: member.id,
      financialYearId: year.id,
      totalPaid: "abc",
    }),
  ).toEqual({ ok: false, error: "INVALID_AMOUNT" });
  expect(
    await musterSetPaidAction({
      memberId: member.id,
      financialYearId: year.id,
      totalPaid: "-5",
    }),
  ).toEqual({ ok: false, error: "INVALID_AMOUNT" });
});

test("setPaid without payment.create is FORBIDDEN", async () => {
  const { member, year } = await setup(["member.view", "fee.view"]);
  const res = await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "100",
  });
  expect(res).toEqual({ ok: false, error: "FORBIDDEN" });
});

test("quickAdd creates an active member with code, status and fullNameEn", async () => {
  const { status } = await setup();
  const res = await musterQuickAddAction({
    fullName: "नवीन सदस्य",
    fullNameEn: "Naveen Sadasya",
    mobile: "9876543210",
  });
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  expect(res.member.memberCode).toBe("NTM0001");
  expect(res.member.fullName).toBe("नवीन सदस्य");
  expect(res.member.fullNameEn).toBe("Naveen Sadasya");
  expect(res.member.mobile).toBe("9876543210");
  expect(res.member.isActive).toBe(true);
  expect(res.member.cells).toEqual({});

  const row = await testDb.member.findFirst({ where: { id: res.member.id } });
  expect(row!.statusId).toBe(status.id);
  expect(row!.fullNameEn).toBe("Naveen Sadasya");
});

test("quickAdd requires a name", async () => {
  await setup();
  expect(await musterQuickAddAction({ fullName: "   " })).toEqual({
    ok: false,
    error: "NAME_REQUIRED",
  });
});

test("updateMember edits mobile inline and audits", async () => {
  const { member } = await setup();
  const res = await musterUpdateMemberAction({
    memberId: member.id,
    field: "mobile",
    value: "9000000000",
  });
  expect(res).toEqual({ ok: true });
  const row = await testDb.member.findFirst({ where: { id: member.id } });
  expect(row!.mobile).toBe("9000000000");

  // Empty mobile clears to null.
  await musterUpdateMemberAction({ memberId: member.id, field: "mobile", value: "" });
  const cleared = await testDb.member.findFirst({ where: { id: member.id } });
  expect(cleared!.mobile).toBeNull();
});

test("updateMember rejects an empty fullName", async () => {
  const { member } = await setup();
  const res = await musterUpdateMemberAction({
    memberId: member.id,
    field: "fullName",
    value: "  ",
  });
  expect(res).toEqual({ ok: false, error: "NAME_REQUIRED" });
  const row = await testDb.member.findFirst({ where: { id: member.id } });
  expect(row!.fullName).toBe("अ");
});

test("deactivate then restore round-trips isActive", async () => {
  const { member } = await setup();
  expect(await musterDeactivateAction(member.id)).toEqual({ ok: true });
  let row = await testDb.member.findFirst({ where: { id: member.id } });
  expect(row!.isActive).toBe(false);

  expect(await musterRestoreAction(member.id)).toEqual({ ok: true });
  row = await testDb.member.findFirst({ where: { id: member.id } });
  expect(row!.isActive).toBe(true);
});

test("getMusterData returns years, all members and vargani cells", async () => {
  const { member, year } = await setup();
  await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "300",
  });
  await musterDeactivateAction(member.id);

  const data = await getMusterData();
  expect(data.years).toEqual([
    { id: year.id, label: "2025-26", feeAmount: "500" },
  ]);
  expect(data.members).toHaveLength(1); // inactive members still listed
  expect(data.members[0].isActive).toBe(false);
  expect(data.members[0].cells[year.id]).toEqual({
    feeAmount: "500",
    paid: "300",
    pending: "200",
    status: "Partial",
  });
});

test("getMusterData hides cells without fee.view", async () => {
  const { org, member, year } = await setup();
  await musterSetPaidAction({
    memberId: member.id,
    financialYearId: year.id,
    totalPaid: "300",
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: ["member.view"],
  });
  const data = await getMusterData();
  expect(data.members[0].cells).toEqual({});
});
