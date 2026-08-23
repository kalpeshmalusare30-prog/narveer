import { test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { loginAsAdmin } from "./helpers";

const DIR = "screenshots";

test("phase 2 demo screenshots", async ({ page }) => {
  test.setTimeout(120000);
  await loginAsAdmin(page);

  const members: [string, string][] = [
    ["Ramesh Kadam", "9876543210"],
    ["Sunita Patil", "9822001122"],
    ["Vitthal More", "9011223344"],
  ];
  for (const [name, mob] of members) {
    await page.goto("/members/new");
    await page.getByLabel("Full Name", { exact: true }).fill(name);
    await page.getByLabel("Mobile", { exact: true }).fill(mob);
    await page
      .locator('select[name="statusId"]')
      .selectOption({ label: "Active" });
    await page.getByRole("button", { name: /^Save$/ }).click();
    await page.waitForURL(/\/members(\?|$)/);
  }

  // Financial year + assignment
  await page.goto("/finance/years");
  await page.getByLabel(/label/i).fill("2025-26");
  await page.getByLabel(/membership fee/i).fill("1000");
  await page.getByRole("button", { name: /^Add$/ }).click();
  await page.getByRole("cell", { name: "2025-26" }).waitFor();
  await page.screenshot({ path: `${DIR}/p2-01-years.png`, fullPage: true });

  await page.getByRole("link", { name: "2025-26" }).click();
  await page.waitForURL(/\/finance\/years\/[^/]+$/);
  await page.getByRole("button", { name: /generate for all/i }).click();
  await page.getByText(/Assigned to \d+ member/i).waitFor();
  await page.reload();
  await page.screenshot({
    path: `${DIR}/p2-02-year-detail.png`,
    fullPage: true,
  });

  // Record payment
  await page.goto("/payments/new");
  const sel = page.getByTestId("member-select");
  const val = await sel
    .locator("option", { hasText: "Ramesh Kadam" })
    .getAttribute("value");
  await sel.selectOption(val!);
  await page.locator("input[data-fee]").first().waitFor();
  await page.getByLabel("Amount", { exact: true }).fill("1000");
  await page.getByText(/Unallocated: ₹0\.00/).waitFor();
  await page.screenshot({
    path: `${DIR}/p2-03-record-payment.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /save payment/i }).click();
  await page.waitForURL(/\/payments(\?|$)/);
  await page.screenshot({ path: `${DIR}/p2-04-payments.png`, fullPage: true });

  // Save the real receipt PDF
  const href = await page
    .locator('a[href*="/receipts/"][href$="/pdf"]')
    .first()
    .getAttribute("href");
  const res = await page.request.get(href!);
  await writeFile(`${DIR}/p2-receipt.pdf`, await res.body());

  await page.goto("/receipts");
  await page.screenshot({ path: `${DIR}/p2-05-receipts.png`, fullPage: true });

  // Member profile — Annual Fees tab
  await page.goto("/members");
  await page.getByRole("link", { name: "Ramesh Kadam" }).click();
  await page.waitForURL(/\/members\/[^/]+$/);
  await page.getByRole("button", { name: "Annual Fees" }).click();
  await page.screenshot({
    path: `${DIR}/p2-06-profile-fees.png`,
    fullPage: true,
  });

  // Dashboard with collection tiles
  await page.goto("/dashboard");
  await page.screenshot({ path: `${DIR}/p2-07-dashboard.png`, fullPage: true });
});
