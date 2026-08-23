import { expect, test } from "vitest";
import { formatINR, parseAmount } from "./money";

test("formats with Indian grouping", () => {
  expect(formatINR("100000")).toBe("₹1,00,000.00");
  expect(formatINR("1200.5")).toBe("₹1,200.50");
  expect(formatINR(0)).toBe("₹0.00");
});

test("parseAmount accepts valid and rejects invalid", () => {
  expect(parseAmount("500").toString()).toBe("500");
  expect(parseAmount("1000.25").toString()).toBe("1000.25");
  expect(() => parseAmount("-1")).toThrow();
  expect(() => parseAmount("abc")).toThrow();
  expect(() => parseAmount("1.234")).toThrow();
});
