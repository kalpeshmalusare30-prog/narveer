import { expect, test } from "vitest";
import { feePending, deriveStatus } from "./calc";

test("feePending computes remaining and clamps at zero", () => {
  expect(feePending("1000", "0", "Pending").toString()).toBe("1000");
  expect(feePending("1000", "400", "Partial").toString()).toBe("600");
  expect(feePending("1000", "1000", "Paid").toString()).toBe("0");
  expect(feePending("1000", "1200", "Paid").toString()).toBe("0");
  expect(feePending("1000", "0", "Waived").toString()).toBe("0");
  expect(feePending("1000", "0", "Exempted").toString()).toBe("0");
});

test("deriveStatus reflects paid amount and preserves manual statuses", () => {
  expect(deriveStatus("1000", "0")).toBe("Pending");
  expect(deriveStatus("1000", "500")).toBe("Partial");
  expect(deriveStatus("1000", "1000")).toBe("Paid");
  expect(deriveStatus("1000", "1500")).toBe("Paid");
  expect(deriveStatus("1000", "0", "Waived")).toBe("Waived");
  expect(deriveStatus("1000", "500", "Exempted")).toBe("Exempted");
});
