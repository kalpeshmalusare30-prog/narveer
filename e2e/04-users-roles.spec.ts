import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("create a user with a role", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/users/new");
  const loginId = `user${Date.now()}`;
  await page.getByLabel("Full Name", { exact: true }).fill("New Operator");
  await page.getByLabel("Login ID", { exact: true }).fill(loginId);
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  // check the first available role
  const firstRole = page.locator('input[name="roleIds"]').first();
  await firstRole.check();
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForURL(/\/users(\?|$)/);
  await expect(page.getByRole("cell", { name: loginId })).toBeVisible();
});

test("create a custom role with permissions", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/roles/new");
  const roleName = `Role ${Date.now()}`;
  await page.getByLabel("Role Name", { exact: true }).fill(roleName);
  await page.locator('input[name="permissionKeys"][value="member.view"]').check();
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForURL(/\/roles(\?|$)/);
  await expect(page.getByRole("cell", { name: roleName })).toBeVisible();
});
