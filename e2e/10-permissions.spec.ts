import { test, expect } from "@playwright/test";
import { loginAsAdmin, login, logout } from "./helpers";

test("role-based access restricts nav and blocks forbidden pages", async ({
  page,
}) => {
  test.setTimeout(120000);
  const loginId = `limited${Date.now()}`;

  // Admin creates a Data Entry Operator (no income/reports/users access)
  await loginAsAdmin(page);
  await page.goto("/users/new");
  await page.getByLabel("Full Name", { exact: true }).fill("Limited User");
  await page.getByLabel("Login ID", { exact: true }).fill(loginId);
  await page.getByLabel("Password", { exact: true }).fill("limited123");
  await page.getByLabel("Data Entry Operator").check();
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForURL(/\/users(\?|$)/);
  await logout(page);

  // Log in as the limited user
  await login(page, loginId, "limited123");
  await page.waitForURL(/\/dashboard/);

  // Allowed nav is present, restricted nav is hidden
  await expect(
    page.getByRole("link", { name: "Payments", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Income", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Reports", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Users", exact: true }),
  ).toHaveCount(0);

  // Directly hitting a forbidden page is blocked (server-enforced)
  await page.goto("/finance/income");
  await expect(page.getByText(/don't have permission/i)).toBeVisible();
});
