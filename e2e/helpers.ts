import { Page, expect } from "@playwright/test";

export async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/login id/i).fill(loginId);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page, "admin", "admin123");
  await page.waitForURL(/\/dashboard/);
}

export async function loginAsSuperAdmin(page: Page) {
  await login(page, "superadmin", "super123");
  await page.waitForURL(/\/organizations/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /log out/i }).click();
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
}
