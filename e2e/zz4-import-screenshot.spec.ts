import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("import preview screenshot", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsAdmin(page);
  await page.goto("/import");
  const csv =
    "Name,Mobile,Status\nRamesh Kadam,9876543210,Active\nSunita Patil,9822001122,Active\n,9011223344,Active\nVitthal More,9090909090,Active\n";
  await page.locator('input[type="file"]').setInputFiles({
    name: "members.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: /^Preview$/ }).click();
  await page.getByRole("cell", { name: "Ramesh Kadam" }).waitFor();
  await page
    .getByRole("cell", { name: "Vitthal More" })
    .waitFor();
  await page.screenshot({ path: "screenshots/r-07-import.png", fullPage: true });
});
