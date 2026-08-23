import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("income, expense, balance, reports, whatsapp, audit", async ({ page }) => {
  test.setTimeout(120000);
  await loginAsAdmin(page);

  // Add income
  await page.goto("/finance/income");
  await page.getByLabel("Amount", { exact: true }).fill("500");
  await page.getByRole("button", { name: /save income/i }).click();
  await expect(page.getByRole("cell", { name: "₹500.00" })).toBeVisible();

  // Add expense
  await page.goto("/finance/expenses");
  await page.getByLabel("Amount", { exact: true }).fill("300");
  await page.getByRole("button", { name: /save expense/i }).click();
  await expect(page.getByRole("cell", { name: "₹300.00" })).toBeVisible();

  // Dashboard financial summary (balance) renders
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /income vs expense/i }),
  ).toBeVisible();

  // Reports page + CSV export
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Reports", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Total Income/i).first()).toBeVisible();
  const res = await page.request.get("/reports/export/collection");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");

  // WhatsApp shows the unconfigured banner honestly
  await page.goto("/whatsapp");
  await expect(page.getByText(/not configured/i)).toBeVisible();

  // Audit log shows recorded actions
  await page.goto("/audit");
  await expect(
    page.getByRole("heading", { name: /audit/i }),
  ).toBeVisible();
  await expect(page.getByText("income").first()).toBeVisible();
});
