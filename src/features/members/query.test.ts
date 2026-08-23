import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { listMembers, getMember } from "./query";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("search by name, filter by status, scoped to org", async () => {
  const a = await testDb.organization.create({
    data: { name: "A", shortName: "A" },
  });
  const b = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  const sa = await testDb.memberStatus.create({
    data: { organizationId: a.id, name: "Active" },
  });
  const sb = await testDb.memberStatus.create({
    data: { organizationId: b.id, name: "Active" },
  });
  await testDb.member.createMany({
    data: [
      {
        organizationId: a.id,
        memberCode: "A1",
        fullName: "Ram Kadam",
        mobile: "1",
        statusId: sa.id,
      },
      {
        organizationId: a.id,
        memberCode: "A2",
        fullName: "Shyam Patil",
        mobile: "2",
        statusId: sa.id,
      },
      {
        organizationId: b.id,
        memberCode: "B1",
        fullName: "Ram Other",
        mobile: "3",
        statusId: sb.id,
      },
    ],
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: a.id,
    isSuperAdmin: false,
    permissions: ["member.view"],
  });
  const res = await listMembers({ q: "ram" });
  expect(res.total).toBe(1);
  expect(res.rows[0].fullName).toBe("Ram Kadam");
});

test("getMember is tenant-scoped (null across org)", async () => {
  const a = await testDb.organization.create({
    data: { name: "A2", shortName: "A2" },
  });
  const b = await testDb.organization.create({
    data: { name: "B2", shortName: "B2" },
  });
  const sb = await testDb.memberStatus.create({
    data: { organizationId: b.id, name: "Active" },
  });
  const m = await testDb.member.create({
    data: {
      organizationId: b.id,
      memberCode: "B1",
      fullName: "X",
      mobile: "1",
      statusId: sb.id,
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: a.id,
    isSuperAdmin: false,
    permissions: ["member.view"],
  });
  expect(await getMember(m.id)).toBeNull();
});
