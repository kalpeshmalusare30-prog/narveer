import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("CSV member import: preview then commit", async ({ page }) => {
  test.setTimeout(90000);
  await loginAsAdmin(page);
  await page.goto("/import");

  const stamp = Date.now();
  const csv = `Name,Mobile,Status\nImport Alice ${stamp},90011${stamp % 100000}\nImport Bob ${stamp},90022${stamp % 100000}\n,90033${stamp % 100000}\n`;

  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "members.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

  // Preview (dry run) — 2 valid, 1 error (missing name), nothing saved
  await page.getByRole("button", { name: /^Preview$/ }).click();
  await expect(page.getByText("Valid").first()).toBeVisible();
  await expect(
    page.getByRole("cell", { name: `Import Alice ${stamp}` }),
  ).toBeVisible();

  // Commit
  await page.getByRole("button", { name: /^Import$/ }).click();
  await expect(page.getByText(/Import complete/i)).toBeVisible();

  // Verify in members list
  await page.goto("/members");
  await page.getByPlaceholder(/search name/i).fill(`Import Alice ${stamp}`);
  await page.getByRole("button", { name: /^Search$/ }).click();
  await expect(
    page.getByRole("link", { name: `Import Alice ${stamp}` }),
  ).toBeVisible();
});
