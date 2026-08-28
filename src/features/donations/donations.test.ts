import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";

// Server actions call revalidatePath, which needs Next's request context.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
import { voidDonation } from "./actions";
import { listDonations, getDonationsTotal } from "./query";
import { getFinancialSummary } from "@/features/finance/money-query";

const PERMS = ["donation.view", "donation.create", "donation.void", "income.view"];

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
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

test("donations count toward the total and the balance", async () => {
  const { org } = await setup();
  await testDb.donation.create({
    data: { organizationId: org.id, donorName: "D1", amount: "500", kind: "Donation" },
  });
  await testDb.donation.create({
    data: { organizationId: org.id, donorName: "D2", amount: "250", kind: "Sponsorship" },
  });
  expect(await getDonationsTotal()).toBe("750");
  const s = await getFinancialSummary();
  expect(s.otherIncome).toBe("750"); // donations feed "other income"
  expect(s.balance).toBe("750");
});

test("voided donation is excluded from total and balance", async () => {
  const { org } = await setup();
  const d = await testDb.donation.create({
    data: { organizationId: org.id, donorName: "D", amount: "500", kind: "Donation" },
  });
  await voidDonation(d.id);
  expect(await getDonationsTotal()).toBe("0");
  const s = await getFinancialSummary();
  expect(s.balance).toBe("0");
});

test("donations are tenant-scoped", async () => {
  const { org } = await setup();
  await testDb.donation.create({
    data: { organizationId: org.id, donorName: "Mine", amount: "100", kind: "Donation" },
  });
  const other = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  await testDb.donation.create({
    data: { organizationId: other.id, donorName: "Theirs", amount: "999", kind: "Donation" },
  });
  const rows = await listDonations();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBe(org.id);
});
