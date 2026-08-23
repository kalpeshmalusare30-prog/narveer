import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { nextReceiptNumber } from "./generate";

beforeEach(resetDb);

test("generates sequential unique receipt numbers", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O", receiptNumberPrefix: "NTM" },
  });
  const nums = await Promise.all(
    Array.from({ length: 4 }, () => nextReceiptNumber(org.id)),
  );
  expect(new Set(nums).size).toBe(4);
  expect(nums).toContain("NTM0001");
  expect(nums).toContain("NTM0004");
});
