import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// The seed creates no members, financial years or fees, so this spec builds
// its own data: a financial year (fee 1000) via the finance UI, then a member
// via the muster quick-add row. Typing a total into that member's year cell
// exercises the auto-assign + cash-payment + receipt path.
test("muster register: grid, quick add, vargani entry, deactivate/restore", async ({
  page,
}) => {
  test.setTimeout(120000);
  await loginAsAdmin(page);
  const stamp = Date.now();
  const yearLabel = `M-${stamp}`;
  const name = `Muster E2E Member ${stamp}`;

  // Create a financial year so the muster has a vargani column.
  await page.goto("/finance/years");
  await page.getByLabel(/label/i).fill(yearLabel);
  await page.getByLabel(/membership fee/i).fill("1000");
  await page.getByRole("button", { name: /^Add$/ }).click();
  await expect(page.getByRole("cell", { name: yearLabel })).toBeVisible();

  // (a) grid visible
  await page.goto("/muster");
  await expect(page.getByTestId("muster-search")).toBeVisible();
  await expect(page.getByTestId("muster-add-name")).toBeVisible();

  // (b) quick add — retried to absorb hydration timing (a pre-hydration
  // click is a no-op). Row locators are scoped by member code afterwards.
  const namedRow = page
    .locator('tr[data-testid^="muster-row-"]')
    .filter({ hasText: name });
  await expect(async () => {
    await page.getByTestId("muster-add-name").fill(name);
    await page.getByTestId("muster-add-mobile").fill("9876512345");
    await page.getByTestId("muster-add-btn").click();
    await expect(namedRow.first()).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30000 });
  const code = (await namedRow.first().getAttribute("data-testid"))!.replace(
    "muster-row-",
    "",
  );
  const row = page.getByTestId(`muster-row-${code}`);
  await expect(row).toBeVisible();
  await expect(
    page.locator('tr[data-testid^="muster-row-"]').first(),
  ).toBeVisible();

  // (c) vargani entry — the new member has no fee assigned for the new year
  // ("—" state); entering the full amount auto-assigns the year fee, records
  // a cash payment and shows the paid state.
  const cell = row.locator(`td[data-year="${yearLabel}"]`);
  await expect(cell).toHaveText("—");
  await cell.click();
  const amountInput = cell.locator("input");
  await expect(amountInput).toBeVisible();
  await amountInput.fill("1000");
  await amountInput.press("Enter");
  await expect(page.getByTestId("muster-toast")).toContainText(/receipt/i);
  await expect(cell).toContainText("₹1,000.00");
  await expect(cell).toHaveClass(/bg-emerald/);

  // WhatsApp click-to-send: fully paid member gets a thank-you wa.me link
  // built from their mobile (+91 prefixed).
  await expect(page.getByTestId(`muster-wa-${code}`)).toHaveAttribute(
    "href",
    /wa\.me\/919876512345\?text=/,
  );

  // (d) deactivate → row leaves the active view
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByTestId(`muster-deactivate-${code}`).click();
  await expect(row).toHaveCount(0);

  // show inactive → row is back with a restore action
  await page.getByTestId("muster-show-inactive").check();
  await expect(row).toBeVisible();
  await expect(page.getByTestId(`muster-restore-${code}`)).toBeVisible();

  // restore → active again (deactivate action reappears, row stays visible
  // even with the inactive filter off)
  await page.getByTestId(`muster-restore-${code}`).click();
  await expect(page.getByTestId(`muster-deactivate-${code}`)).toBeVisible();
  await page.getByTestId("muster-show-inactive").uncheck();
  await expect(row).toBeVisible();
});
