import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("ntmp data + webhook screenshots", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsAdmin(page);

  await page.goto("/members");
  await page.getByRole("link", { name: "विजय नारायण मालुसरे" }).waitFor();
  await page.screenshot({ path: "screenshots/r-10-members.png", fullPage: true });

  await page.getByRole("link", { name: "विजय नारायण मालुसरे" }).click();
  await page.waitForURL(/\/members\/[^/]+$/);
  await page.getByRole("button", { name: "Annual Fees" }).click();
  await page.getByText("2026-27").waitFor();
  await page.screenshot({
    path: "screenshots/r-11-member-profile.png",
    fullPage: true,
  });

  await page.goto("/whatsapp/settings");
  await page.getByText("Callback URL", { exact: true }).waitFor();
  await page.screenshot({
    path: "screenshots/r-12-whatsapp-settings.png",
    fullPage: true,
  });
});
