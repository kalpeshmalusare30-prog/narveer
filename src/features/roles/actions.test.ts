import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import {
  createRole,
  updateRolePermissions,
  deleteRole,
} from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("manages custom role permissions and protects system roles", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  const sys = await testDb.role.create({
    data: { organizationId: org.id, name: "Org Admin", isSystem: true },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: ["role.manage", "role.view"],
  });

  const role = await createRole("Volunteer", null, ["member.view"]);
  expect(await testDb.rolePermission.count({ where: { roleId: role.id } })).toBe(
    1,
  );

  await updateRolePermissions(role.id, ["member.view", "member.create"]);
  expect(await testDb.rolePermission.count({ where: { roleId: role.id } })).toBe(
    2,
  );

  await expect(deleteRole(sys.id)).rejects.toThrow(/system/i);
  await expect(createRole("Bad", null, ["not.a.perm"])).rejects.toThrow(
    /permission/i,
  );
});

test("role management is tenant-scoped", async () => {
  const a = await testDb.organization.create({
    data: { name: "A", shortName: "A" },
  });
  const b = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  const foreign = await testDb.role.create({
    data: { organizationId: b.id, name: "Foreign" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: a.id,
    isSuperAdmin: false,
    permissions: ["role.manage"],
  });
  await expect(
    updateRolePermissions(foreign.id, ["member.view"]),
  ).rejects.toThrow(/NOT_FOUND/);
});
