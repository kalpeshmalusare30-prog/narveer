import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { createOrganization, setOrganizationActive } from "./actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

function asSuperAdmin() {
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "sa",
    fullName: "SA",
    organizationId: null,
    isSuperAdmin: true,
    permissions: ["org.view", "org.create", "org.manage"],
  });
}

test("super admin creates org with system roles + defaults, then deactivates", async () => {
  asSuperAdmin();
  const org = await createOrganization({ name: "New Mandal", shortName: "NM" });
  expect(org.isActive).toBe(true);

  const roles = await testDb.role.findMany({
    where: { organizationId: org.id },
  });
  expect(roles.length).toBeGreaterThanOrEqual(4);

  const statuses = await testDb.memberStatus.count({
    where: { organizationId: org.id },
  });
  expect(statuses).toBe(3);

  await setOrganizationActive(org.id, false);
  expect(
    (await testDb.organization.findUnique({ where: { id: org.id } }))?.isActive,
  ).toBe(false);
});

test("non-super-admin cannot create org", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: "o",
    isSuperAdmin: false,
    permissions: ["org.create"],
  });
  await expect(
    createOrganization({ name: "X", shortName: "X" }),
  ).rejects.toThrow(/FORBIDDEN/);
});
