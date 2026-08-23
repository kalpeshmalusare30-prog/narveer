import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "./helpers";

test("super admin creates an organization", async ({ page }) => {
  await loginAsSuperAdmin(page);
  await expect(
    page.getByRole("heading", { name: /organizations/i }),
  ).toBeVisible();
  await page.goto("/organizations/new");
  const name = `Mandal ${Date.now()}`;
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Short Name", { exact: true }).fill(`M${Date.now()}`);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForURL(/\/organizations(\?|$)/);
  await expect(page.getByRole("cell", { name })).toBeVisible();
});
