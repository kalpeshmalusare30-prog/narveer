import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("create, search, view, edit and void a member", async ({ page }) => {
  await loginAsAdmin(page);
  const name = `Test Member ${Date.now()}`;

  // Create
  await page.goto("/members/new");
  await page.getByLabel("Full Name", { exact: true }).fill(name);
  await page.getByLabel("Mobile", { exact: true }).fill("9876500000");
  await page
    .locator('select[name="statusId"]')
    .selectOption({ label: "Active" });
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.waitForURL(/\/members(\?|$)/);
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Search
  await page.getByPlaceholder(/search/i).fill(name);
  await page.getByRole("button", { name: /^Search$/ }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Profile + tabs
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(/\/members\/[^/]+$/);
  // Tabs are client-interactive; retry to absorb hydration timing.
  await expect(async () => {
    await page.getByRole("button", { name: "Annual Fees" }).click();
    await expect(page.getByTestId("later-phase")).toBeVisible({
      timeout: 1500,
    });
  }).toPass({ timeout: 15000 });

  // Edit
  await page.getByRole("link", { name: /^Edit$/ }).click();
  await page.waitForURL(/\/edit$/);
  const updated = `${name} Edited`;
  await page.getByLabel("Full Name", { exact: true }).fill(updated);
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.waitForURL(/\/members(\?|$)/);
  await expect(page.getByRole("link", { name: updated })).toBeVisible();

  // Void — after voiding, the void action disappears for that row
  const row = page.getByRole("row", { name: new RegExp(updated) });
  await row.getByRole("button", { name: /void/i }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(updated) }).getByRole("button", {
      name: /void/i,
    }),
  ).toHaveCount(0);
});
