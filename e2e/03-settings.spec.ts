import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("add a membership type", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/settings/membership-types");
  const name = `Type ${Date.now()}`;
  await page.getByPlaceholder("Name").fill(name);
  await page.getByRole("button", { name: /^Add$/ }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
});

test("add a member status", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/settings/member-statuses");
  const name = `Status ${Date.now()}`;
  await page.getByPlaceholder("Name").fill(name);
  await page.getByRole("button", { name: /^Add$/ }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
});
