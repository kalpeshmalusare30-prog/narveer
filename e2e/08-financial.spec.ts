import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("financial year, fee assignment, split payment, receipt, void", async ({
  page,
}) => {
  test.setTimeout(120000);
  await loginAsAdmin(page);
  const stamp = Date.now();
  const memberName = `Fin Member ${stamp}`;
  const y1 = `${stamp}-A`;
  const y2 = `${stamp}-B`;

  // Create a member
  await page.goto("/members/new");
  await page.getByLabel("Full Name", { exact: true }).fill(memberName);
  await page.getByLabel("Mobile", { exact: true }).fill("9000000000");
  await page.locator('select[name="statusId"]').selectOption({ label: "Active" });
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.waitForURL(/\/members(\?|$)/);

  // Create two financial years
  await page.goto("/finance/years");
  for (const label of [y1, y2]) {
    await page.getByLabel(/label/i).fill(label);
    await page.getByLabel(/membership fee/i).fill("1000");
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.getByRole("cell", { name: label })).toBeVisible();
  }

  // Assign fees for both years (generate for all active members)
  for (const label of [y1, y2]) {
    await page.getByRole("link", { name: label }).click();
    await page.waitForURL(/\/finance\/years\/[^/]+$/);
    await page.getByRole("button", { name: /generate for all/i }).click();
    await expect(page.getByText(/Assigned to \d+ member/i)).toBeVisible();
    await page.goto("/finance/years");
  }

  // Record a split payment of 1500 across the two years
  await page.goto("/payments/new");
  const sel = page.getByTestId("member-select");
  const val = await sel
    .locator("option", { hasText: memberName })
    .getAttribute("value");
  await sel.selectOption(val!);
  // wait for the member's pending fees to load into the allocation grid
  await expect(page.locator("input[data-fee]").first()).toBeVisible();
  await page.getByLabel("Amount", { exact: true }).fill("1500");
  // auto-allocation runs on amount change; unallocated should be 0
  await expect(page.getByText(/Unallocated: ₹0\.00/)).toBeVisible();
  await page.getByRole("button", { name: /save payment/i }).click();
  await page.waitForURL(/\/payments(\?|$)/);

  // A receipt was created — grab its PDF link and verify it's a real PDF
  const pdfLink = page.locator('a[href*="/receipts/"][href$="/pdf"]').first();
  await expect(pdfLink).toBeVisible();
  const href = await pdfLink.getAttribute("href");
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");

  // Member profile: pending should be 500 across the two years
  await page.goto("/finance/pending");
  const row = page.getByRole("row", { name: new RegExp(memberName) });
  await expect(row).toBeVisible();
  await expect(row.getByText("₹500.00")).toBeVisible();

  // Void the payment → pending restored to 1000 (fee1) ... total 2000
  await page.goto("/payments");
  const payRow = page.getByRole("row", { name: new RegExp(memberName) }).first();
  await payRow.getByRole("button", { name: /void/i }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(memberName) }).first().getByText(
      /voided/i,
    ),
  ).toBeVisible();

  await page.goto("/finance/pending");
  const row2 = page.getByRole("row", { name: new RegExp(memberName) });
  await expect(row2.getByText("₹2,000.00")).toBeVisible();
});
