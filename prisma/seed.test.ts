import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { seed } from "./seed";

beforeEach(resetDb);

test("seed is idempotent and creates org, roles, admin, super admin", async () => {
  await seed();
  await seed();

  const orgs = await testDb.organization.findMany();
  expect(orgs).toHaveLength(1);
  expect(orgs[0].name).toMatch(/Narveer/);
  expect(orgs[0].defaultMembershipFee.toString()).toBe("1000");

  const admin = await testDb.user.findUnique({ where: { loginId: "admin" } });
  expect(admin?.isSuperAdmin).toBe(false);
  expect(admin?.organizationId).toBe(orgs[0].id);

  const sa = await testDb.user.findUnique({ where: { loginId: "superadmin" } });
  expect(sa?.isSuperAdmin).toBe(true);
  expect(sa?.organizationId).toBeNull();

  const roles = await testDb.role.findMany({
    where: { organizationId: orgs[0].id },
  });
  expect(roles.map((r) => r.name)).toEqual(
    expect.arrayContaining(["Org Admin", "Treasurer", "Data Entry Operator"]),
  );

  expect(await testDb.permission.count()).toBeGreaterThan(10);

  const adminRoles = await testDb.userRole.findMany({
    where: { userId: admin!.id },
  });
  expect(adminRoles).toHaveLength(1);

  expect(
    await testDb.memberStatus.count({ where: { organizationId: orgs[0].id } }),
  ).toBe(4);
  expect(
    await testDb.membershipType.count({ where: { organizationId: orgs[0].id } }),
  ).toBe(3);
});
