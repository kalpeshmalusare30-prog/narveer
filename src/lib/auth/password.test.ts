import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";

test("hashes and verifies", async () => {
  const h = await hashPassword("secret123");
  expect(h).not.toBe("secret123");
  expect(await verifyPassword(h, "secret123")).toBe(true);
  expect(await verifyPassword(h, "wrong")).toBe(false);
});

test("verify returns false on malformed hash", async () => {
  expect(await verifyPassword("not-a-hash", "x")).toBe(false);
});
