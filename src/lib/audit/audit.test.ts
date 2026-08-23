import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { writeAudit } from "./audit";

beforeEach(resetDb);

test("writes an audit row scoped to tenant + user", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  await runWithTenant({ organizationId: org.id, userId: "u1" }, async () => {
    await writeAudit({
      action: "update",
      module: "members",
      recordType: "Member",
      recordId: "m1",
      oldValue: { fee: "500" },
      newValue: { fee: "1000" },
    });
  });
  const rows = await testDb.auditLog.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBe(org.id);
  expect(rows[0].userId).toBe("u1");
  expect(rows[0].action).toBe("update");
  expect(rows[0].newValue).toEqual({ fee: "1000" });
});

test("writes a platform-level audit row without tenant context", async () => {
  await writeAudit({
    action: "create",
    module: "organizations",
    recordType: "Organization",
    recordId: "o1",
  });
  const rows = await testDb.auditLog.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBeNull();
});
