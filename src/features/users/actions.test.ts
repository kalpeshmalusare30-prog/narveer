import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { createUser, resetUserPassword, assignRoles } from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

async function orgAdmin(perms: string[]) {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "admin",
    fullName: "Admin",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: perms,
  });
  return org;
}

test("creates a scoped user with hashed password and resets it", async () => {
  const org = await orgAdmin(["user.create", "user.edit"]);
  const u = await createUser({
    fullName: "Ravi",
    loginId: "ravi",
    password: "init1234",
    roleIds: [],
  });
  expect(u.organizationId).toBe(org.id);
  const dbUser = await testDb.user.findUnique({ where: { id: u.id } });
  expect(await verifyPassword(dbUser!.passwordHash, "init1234")).toBe(true);

  await resetUserPassword(u.id, "new12345");
  const after = await testDb.user.findUnique({ where: { id: u.id } });
  expect(await verifyPassword(after!.passwordHash, "new12345")).toBe(true);
});

test("assigns roles that belong to the org and rejects foreign roles", async () => {
  const org = await orgAdmin(["user.create", "user.edit"]);
  const role = await testDb.role.create({
    data: { organizationId: org.id, name: "Ops" },
  });
  const other = await testDb.organization.create({
    data: { name: "Other", shortName: "Other" },
  });
  const foreignRole = await testDb.role.create({
    data: { organizationId: other.id, name: "X" },
  });
  const u = await createUser({
    fullName: "Sam",
    loginId: "sam",
    password: "init1234",
    roleIds: [role.id],
  });
  expect(
    await testDb.userRole.count({ where: { userId: u.id } }),
  ).toBe(1);
  await expect(assignRoles(u.id, [foreignRole.id])).rejects.toThrow(
    /INVALID_ROLE/,
  );
});

test("create denied without permission", async () => {
  await orgAdmin(["user.view"]);
  await expect(
    createUser({ fullName: "N", loginId: "n", password: "init1234" }),
  ).rejects.toThrow(/FORBIDDEN/);
});
