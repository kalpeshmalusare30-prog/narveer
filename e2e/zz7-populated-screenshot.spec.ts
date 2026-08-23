import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("populated app screenshots", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsAdmin(page);

  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/r-13-dashboard.png", fullPage: true });

  await page.goto("/finance/pending");
  await page.getByRole("heading", { name: /pending dues/i }).waitFor();
  await page.screenshot({ path: "screenshots/r-14-pending.png", fullPage: true });

  await page.goto("/reports");
  await page.getByRole("heading", { name: "Reports", exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/r-15-reports.png", fullPage: true });
});
