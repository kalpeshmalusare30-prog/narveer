import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createMember, updateMember, voidMember } from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

async function setup(perms: string[]) {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O", memberCodePrefix: "NTM" },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: perms,
  });
  return { org, status };
}

test("creates member with auto code, audits update, and voids", async () => {
  const { org, status } = await setup([
    "member.create",
    "member.edit",
    "member.void",
  ]);
  const m = await createMember({
    fullName: "Sita",
    mobile: "9999",
    statusId: status.id,
  });
  expect(m.memberCode).toBe("NTM0001");
  expect(m.organizationId).toBe(org.id);

  await updateMember(m.id, {
    fullName: "Sita Rao",
    mobile: "9999",
    statusId: status.id,
  });
  expect(
    (await testDb.auditLog.findMany({ where: { recordId: m.id } })).length,
  ).toBeGreaterThan(0);

  await voidMember(m.id);
  expect(
    (await testDb.member.findUnique({ where: { id: m.id } }))?.isActive,
  ).toBe(false);
});

test("create denied without permission", async () => {
  const { status } = await setup(["member.view"]);
  await expect(
    createMember({ fullName: "X", mobile: "1", statusId: status.id }),
  ).rejects.toThrow(/FORBIDDEN/);
});

test("rejects a status from another organization", async () => {
  const { status } = await setup(["member.create"]);
  void status;
  const other = await testDb.organization.create({
    data: { name: "Other", shortName: "Other" },
  });
  const otherStatus = await testDb.memberStatus.create({
    data: { organizationId: other.id, name: "Active" },
  });
  await expect(
    createMember({ fullName: "Y", mobile: "2", statusId: otherStatus.id }),
  ).rejects.toThrow(/INVALID_STATUS/);
});
