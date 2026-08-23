import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("search + notifications screenshots", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsAdmin(page);

  await page.goto("/notifications");
  await page.getByRole("heading", { name: /notifications/i }).waitFor();
  await page.screenshot({
    path: "screenshots/r-08-notifications.png",
    fullPage: true,
  });

  const box = page.getByPlaceholder(/search members/i);
  await box.fill("Ramesh");
  await box.press("Enter");
  await page.waitForURL(/\/search\?q=/);
  await page.getByRole("heading", { name: "Search", exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/r-09-search.png", fullPage: true });
});
