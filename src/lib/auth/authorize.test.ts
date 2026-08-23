import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { authorizeCredentials } from "./authorize";
import { hashPassword } from "./password";

beforeEach(resetDb);

async function makeUser(active = true) {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  return testDb.user.create({
    data: {
      organizationId: org.id,
      fullName: "Amit",
      loginId: "amit",
      email: "amit@example.com",
      passwordHash: await hashPassword("pass1234"),
      isActive: active,
    },
  });
}

test("valid credentials authorize (by login id)", async () => {
  await makeUser();
  const u = await authorizeCredentials("amit", "pass1234");
  expect(u?.fullName).toBe("Amit");
});

test("valid credentials authorize (by email)", async () => {
  await makeUser();
  const u = await authorizeCredentials("amit@example.com", "pass1234");
  expect(u?.fullName).toBe("Amit");
});

test("wrong password rejected", async () => {
  await makeUser();
  expect(await authorizeCredentials("amit", "nope")).toBeNull();
});

test("inactive user rejected", async () => {
  await makeUser(false);
  expect(await authorizeCredentials("amit", "pass1234")).toBeNull();
});
