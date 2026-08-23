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
  await page.getByPlaceholder(/search name/i).fill(name);
  await page.getByRole("button", { name: /^Search$/ }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Profile + tabs
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(/\/members\/[^/]+$/);
  // Tabs are client-interactive; retry to absorb hydration timing.
  // Annual Fees is live from Phase 2; the WhatsApp tab remains a Phase-3 placeholder.
  await expect(async () => {
    await page.getByRole("button", { name: "WhatsApp" }).click();
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

  // Void — now lives on the member detail page in a danger zone with a
  // two-step confirm. After voiding, the member is inactive and the void
  // action disappears.
  await page.getByRole("link", { name: updated }).click();
  await expect(page).toHaveURL(/\/members\/[^/]+$/);
  await page.getByRole("button", { name: /void member/i }).click(); // trigger
  await page.getByRole("button", { name: /^Cancel$/ }).waitFor(); // confirm mode
  await page.getByRole("button", { name: /void member/i }).click(); // confirm
  await expect(page.getByRole("button", { name: /void member/i })).toHaveCount(0);
});
