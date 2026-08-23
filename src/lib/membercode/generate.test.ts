import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { nextMemberCode } from "./generate";

beforeEach(resetDb);

test("generates sequential unique codes under concurrency", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O", memberCodePrefix: "NTM" },
  });
  const codes = await Promise.all(
    Array.from({ length: 5 }, () => nextMemberCode(org.id)),
  );
  expect(new Set(codes).size).toBe(5);
  expect(codes).toContain("NTM0001");
  expect(codes).toContain("NTM0005");
});
