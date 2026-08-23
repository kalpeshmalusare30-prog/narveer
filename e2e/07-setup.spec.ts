import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("complete the organization setup wizard", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/setup");
  await expect(page.getByTestId("setup-step")).toContainText("1");

  // Step 1: org details
  await page.getByRole("button", { name: /save & continue/i }).click();
  await expect(page.getByTestId("setup-step")).toContainText("2");

  // Step 2: financial config
  await page.getByLabel(/default membership fee/i).fill("1200");
  await page.getByRole("button", { name: /save & continue/i }).click();
  await expect(page.getByTestId("setup-step")).toContainText("3");

  // Step 3: communication stub
  await page.getByRole("button", { name: /save & continue/i }).click();
  await expect(page.getByTestId("setup-step")).toContainText("4");

  // Step 4: finish
  await page.getByRole("button", { name: /finish setup/i }).click();
  await page.waitForURL(/\/dashboard/);
});
