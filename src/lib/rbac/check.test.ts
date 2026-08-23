import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { PERMISSIONS, hasPermission, resolveUserPermissions } from "./check";

beforeEach(resetDb);

test("catalog contains member.create and hasPermission works", () => {
  expect(PERMISSIONS).toContain("member.create");
  expect(hasPermission(["member.view", "member.create"], "member.create")).toBe(
    true,
  );
  expect(hasPermission(["member.view"], "member.create")).toBe(false);
});

test("resolveUserPermissions unions role permissions", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  await testDb.permission.createMany({
    data: [{ key: "member.view" }, { key: "member.create" }],
  });
  const role = await testDb.role.create({
    data: {
      organizationId: org.id,
      name: "Ops",
      rolePermissions: {
        create: [
          { permissionKey: "member.view" },
          { permissionKey: "member.create" },
        ],
      },
    },
  });
  const user = await testDb.user.create({
    data: {
      organizationId: org.id,
      fullName: "U",
      loginId: "u1",
      passwordHash: "x",
      userRoles: { create: [{ roleId: role.id }] },
    },
  });
  const perms = await resolveUserPermissions(user.id);
  expect(perms.sort()).toEqual(["member.create", "member.view"]);
});

test("super admin resolves to platform permissions", async () => {
  const user = await testDb.user.create({
    data: {
      fullName: "SA",
      loginId: "sa",
      passwordHash: "x",
      isSuperAdmin: true,
    },
  });
  const perms = await resolveUserPermissions(user.id);
  expect(perms).toContain("org.create");
});
