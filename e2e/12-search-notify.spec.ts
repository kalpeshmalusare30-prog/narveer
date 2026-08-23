import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("global search and notifications", async ({ page }) => {
  test.setTimeout(90000);
  await loginAsAdmin(page);
  const stamp = Date.now();
  const name = `Search Target ${stamp}`;

  // Creating a member also generates a notification
  await page.goto("/members/new");
  await page.getByLabel("Full Name", { exact: true }).fill(name);
  await page.getByLabel("Mobile", { exact: true }).fill(`955${stamp % 1000000}`);
  await page.locator('select[name="statusId"]').selectOption({ label: "Active" });
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.waitForURL(/\/members(\?|$)/);

  // Global search from the sidebar box
  const box = page.getByPlaceholder(/search members/i);
  await box.fill(name);
  await box.press("Enter");
  await page.waitForURL(/\/search\?q=/);
  await expect(
    page.getByRole("link", { name: new RegExp(name) }),
  ).toBeVisible();

  // Notification recorded for the new member
  await page.goto("/notifications");
  await expect(
    page.getByText(new RegExp(`New member added: ${name}`)),
  ).toBeVisible();

  // Mark all read works
  await page.getByRole("button", { name: /mark all read/i }).click();
  await expect(
    page.getByRole("button", { name: /mark all read/i }),
  ).toHaveCount(0);
});
