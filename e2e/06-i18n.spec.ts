import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("toggle interface language to Marathi", async ({ page }) => {
  await loginAsAdmin(page);
  // English nav visible
  await expect(
    page.getByRole("link", { name: "Members", exact: true }),
  ).toBeVisible();
  // Switch to Marathi
  await page.getByRole("button", { name: "mr", exact: true }).click();
  await page.waitForURL(/\/mr(\/|$)/);
  // Marathi nav label for "Members"
  await expect(
    page.getByRole("link", { name: "सभासद", exact: true }),
  ).toBeVisible();
});
