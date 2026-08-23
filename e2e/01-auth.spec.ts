import { test, expect } from "@playwright/test";
import { loginAsAdmin, logout } from "./helpers";

test("rejects invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/login id/i).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrongpass");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("org admin can log in and see the dashboard, then log out", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await expect(page.getByTestId("stat-total")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Members", exact: true }),
  ).toBeVisible();
  await logout(page);
});

test("unauthenticated access redirects to login", async ({ page }) => {
  await page.goto("/members");
  await expect(page).toHaveURL(/\/login/);
});
