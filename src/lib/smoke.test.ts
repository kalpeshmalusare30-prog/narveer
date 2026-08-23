import { expect, test } from "vitest";
import { ping } from "./smoke";

test("toolchain runs", () => {
  expect(ping()).toBe("pong");
});
