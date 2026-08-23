import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import {
  createMembershipType,
  createMemberStatus,
} from "./config-actions";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("membership type is tenant-scoped and rejects duplicates", async () => {
  const a = await testDb.organization.create({
    data: { name: "A", shortName: "A" },
  });
  const b = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: a.id,
    isSuperAdmin: false,
    permissions: ["settings.membership_type.manage"],
  });
  await createMembershipType("General");
  expect(
    await testDb.membershipType.count({ where: { organizationId: a.id } }),
  ).toBe(1);
  expect(
    await testDb.membershipType.count({ where: { organizationId: b.id } }),
  ).toBe(0);
  await expect(createMembershipType("General")).rejects.toThrow(/DUPLICATE/);
});

test("member status stores terminal flag", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: ["settings.member_status.manage"],
  });
  const s = await createMemberStatus("Left Organization", true);
  expect(s.isTerminal).toBe(true);
  expect(s.organizationId).toBe(org.id);
});
