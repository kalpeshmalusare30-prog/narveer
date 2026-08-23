import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { db } from "./prisma";
import { runWithTenant } from "./tenant-context";

beforeEach(resetDb);

test("scoped client isolates orgs and injects organizationId", async () => {
  const a = await testDb.organization.create({
    data: { name: "A", shortName: "A" },
  });
  const b = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  const statusA = await testDb.memberStatus.create({
    data: { organizationId: a.id, name: "Active" },
  });
  const statusB = await testDb.memberStatus.create({
    data: { organizationId: b.id, name: "Active" },
  });

  // Deliberately omit organizationId to prove the extension injects it.
  await runWithTenant({ organizationId: a.id }, async () => {
    await db.member.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        memberCode: "M0001",
        fullName: "Alice",
        mobile: "1",
        statusId: statusA.id,
      } as any,
    });
  });
  await runWithTenant({ organizationId: b.id }, async () => {
    await db.member.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        memberCode: "M0001",
        fullName: "Bob",
        mobile: "2",
        statusId: statusB.id,
      } as any,
    });
  });

  const fromA = await runWithTenant({ organizationId: a.id }, () =>
    db.member.findMany(),
  );
  expect(fromA).toHaveLength(1);
  expect(fromA[0].fullName).toBe("Alice");
  expect(fromA[0].organizationId).toBe(a.id);
});

test("update/findUnique cannot cross org boundary", async () => {
  const a = await testDb.organization.create({
    data: { name: "A2", shortName: "A2" },
  });
  const b = await testDb.organization.create({
    data: { name: "B2", shortName: "B2" },
  });
  const statusB = await testDb.memberStatus.create({
    data: { organizationId: b.id, name: "Active" },
  });
  const memberB = await testDb.member.create({
    data: {
      organizationId: b.id,
      memberCode: "B0001",
      fullName: "Bee",
      mobile: "9",
      statusId: statusB.id,
    },
  });

  // Org A tries to read/update org B's member — must not find it.
  const found = await runWithTenant({ organizationId: a.id }, () =>
    db.member.findUnique({ where: { id: memberB.id } }),
  );
  expect(found).toBeNull();

  await runWithTenant({ organizationId: a.id }, async () => {
    await expect(
      db.member.update({
        where: { id: memberB.id },
        data: { fullName: "Hacked" },
      }),
    ).rejects.toThrow();
  });

  const stillBee = await testDb.member.findUnique({
    where: { id: memberB.id },
  });
  expect(stillBee?.fullName).toBe("Bee");
});

test("tenant model access without context throws", async () => {
  await expect(db.member.findMany()).rejects.toThrow(/tenant/i);
});
