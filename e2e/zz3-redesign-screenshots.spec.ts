import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const DIR = "screenshots";

test("redesign demo screenshots", async ({ page }) => {
  test.setTimeout(150000);
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

  // FY + assignment
  await page.goto("/finance/years");
  await page.getByLabel(/label/i).fill("2025-26");
  await page.getByLabel(/membership fee/i).fill("1000");
  await page.getByRole("button", { name: /^Add$/ }).click();
  await page.getByRole("cell", { name: "2025-26" }).waitFor();
  await page.getByRole("link", { name: "2025-26" }).click();
  await page.waitForURL(/\/finance\/years\/[^/]+$/);
  await page.getByRole("button", { name: /generate for all/i }).click();
  await page.getByText(/Assigned to \d+ member/i).waitFor();
  await page.reload();
  await page.screenshot({ path: `${DIR}/r-05-year-detail.png`, fullPage: true });

  // A payment
  await page.goto("/payments/new");
  const sel = page.getByTestId("member-select");
  const val = await sel
    .locator("option", { hasText: "Ramesh Kadam" })
    .getAttribute("value");
  await sel.selectOption(val!);
  await page.locator("input[data-fee]").first().waitFor();
  await page.getByLabel("Amount", { exact: true }).fill("1000");
  await page.getByText(/Unallocated: ₹0\.00/).waitFor();
  await page.getByRole("button", { name: /save payment/i }).click();
  await page.waitForURL(/\/payments(\?|$)/);

  // Income + expense
  await page.goto("/finance/income");
  await page.getByLabel("Amount", { exact: true }).fill("5000");
  await page.getByRole("button", { name: /save income/i }).click();
  await page.getByRole("cell", { name: "₹5,000.00" }).waitFor();
  await page.goto("/finance/expenses");
  await page.getByLabel("Amount", { exact: true }).fill("2000");
  await page.getByRole("button", { name: /save expense/i }).click();
  await page.getByRole("cell", { name: "₹2,000.00" }).waitFor();

  // Dashboard (desktop)
  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.screenshot({ path: `${DIR}/r-01-dashboard.png`, fullPage: true });

  // Members
  await page.goto("/members");
  await page.screenshot({ path: `${DIR}/r-02-members.png`, fullPage: true });

  // Reports
  await page.goto("/reports");
  await page.getByRole("heading", { name: "Reports", exact: true }).waitFor();
  await page.screenshot({ path: `${DIR}/r-03-reports.png`, fullPage: true });

  // WhatsApp
  await page.goto("/whatsapp");
  await page.screenshot({ path: `${DIR}/r-04-whatsapp.png`, fullPage: true });

  // Mobile dashboard
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.screenshot({ path: `${DIR}/r-06-mobile-dashboard.png`, fullPage: true });
});
