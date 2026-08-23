import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { runImport } from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

async function org() {
  const o = await testDb.organization.create({
    data: { name: "O", shortName: "O", memberCodePrefix: "M" },
  });
  await testDb.memberStatus.create({
    data: { organizationId: o.id, name: "Active" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: o.id,
    isSuperAdmin: false,
    permissions: ["data.import"],
  });
  return o;
}

function fd(type: string, dryRun: boolean, csv: string) {
  const file = new File([csv], "data.csv", { type: "text/csv" });
  const form = new FormData();
  form.set("type", type);
  form.set("dryRun", String(dryRun));
  form.set("file", file);
  return form;
}

test("members: dry-run previews without writing, commit imports, re-run dedups", async () => {
  await org();
  const csv =
    "Name,Mobile,Status\nRamesh,9990001111,Active\n,8880002222,Active\nSunita,9990003333,Active\n";

  const preview = await runImport(fd("members", true, csv));
  expect(preview.total).toBe(3);
  expect(preview.ok).toBe(2);
  expect(preview.errors).toBe(1); // missing name
  expect(preview.imported).toBe(0);
  expect(await testDb.member.count()).toBe(0);

  const commit = await runImport(fd("members", false, csv));
  expect(commit.imported).toBe(2);
  expect(await testDb.member.count()).toBe(2);

  const again = await runImport(fd("members", false, csv));
  expect(again.duplicates).toBe(2);
  expect(again.imported).toBe(0);
  expect(await testDb.member.count()).toBe(2);
});

test("fees: auto-creates the financial year and records opening-balance paid", async () => {
  const o = await org();
  await runImport(fd("members", false, "Name,Mobile\nRamesh,9990001111\n"));

  const r = await runImport(
    fd(
      "fees",
      false,
      "Mobile,Financial Year,Fee Amount,Paid Amount\n9990001111,2024-25,1000,400\n",
    ),
  );
  expect(r.imported).toBe(1);

  const fy = await testDb.financialYear.findFirst({
    where: { organizationId: o.id, label: "2024-25" },
  });
  expect(fy?.feeAmount.toString()).toBe("1000");
  const fee = await testDb.annualFee.findFirst({
    where: { financialYearId: fy!.id },
  });
  const allocs = await testDb.paymentAllocation.findMany({
    where: { annualFeeId: fee!.id },
  });
  const paid = allocs.reduce((s, a) => s + Number(a.amount), 0);
  expect(paid).toBe(400); // pending would be 600
});

test("import requires the data.import permission", async () => {
  const o = await testDb.organization.create({
    data: { name: "P", shortName: "P" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: o.id,
    isSuperAdmin: false,
    permissions: ["member.view"],
  });
  await expect(
    runImport(fd("members", false, "Name,Mobile\nX,1\n")),
  ).rejects.toThrow(/FORBIDDEN/);
});
