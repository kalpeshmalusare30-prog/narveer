import { beforeEach, expect, test } from "vitest";
import { testDb, resetDb } from "./db";

beforeEach(resetDb);

test("can create an organization with decimal fee", async () => {
  const org = await testDb.organization.create({
    data: { name: "Test", shortName: "T" },
  });
  expect(org.id).toBeTruthy();
  expect(org.defaultMembershipFee.toString()).toBe("0");
});

test("member code is unique per organization", async () => {
  const org = await testDb.organization.create({
    data: { name: "Test2", shortName: "T2" },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M0001",
      fullName: "A",
      mobile: "1",
      statusId: status.id,
    },
  });
  await expect(
    testDb.member.create({
      data: {
        organizationId: org.id,
        memberCode: "M0001",
        fullName: "B",
        mobile: "2",
        statusId: status.id,
      },
    }),
  ).rejects.toThrow();
});
