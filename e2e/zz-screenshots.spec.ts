import { test } from "@playwright/test";
import { loginAsAdmin, loginAsSuperAdmin } from "./helpers";

const DIR = "screenshots";

test("capture demo screenshots", async ({ page }) => {
  // Login page
  await page.goto("/login");
  await page.screenshot({ path: `${DIR}/01-login.png`, fullPage: true });

  await loginAsAdmin(page);

  // Seed a few demo members for a realistic view
  const demo = [
    { name: "Ramesh Kadam", mobile: "9876543210" },
    { name: "Sunita Patil", mobile: "9822001122" },
    { name: "Vitthal More", mobile: "9011223344" },
  ];
  for (const m of demo) {
    await page.goto("/members/new");
    await page.getByLabel("Full Name", { exact: true }).fill(m.name);
    await page.getByLabel("Mobile", { exact: true }).fill(m.mobile);
    await page
      .locator('select[name="statusId"]')
      .selectOption({ label: "Active" });
    await page.getByRole("button", { name: /^Save$/ }).click();
    await page.waitForURL(/\/members(\?|$)/);
  }

  // Dashboard
  await page.goto("/dashboard");
  await page.screenshot({ path: `${DIR}/02-dashboard.png`, fullPage: true });

  // Members list
  await page.goto("/members");
  await page.screenshot({ path: `${DIR}/03-members.png`, fullPage: true });

  // Member profile
  await page.getByRole("link", { name: "Ramesh Kadam" }).click();
  await page.waitForURL(/\/members\/[^/]+$/);
  await page.screenshot({ path: `${DIR}/04-member-profile.png`, fullPage: true });

  // Settings - membership types
  await page.goto("/settings/membership-types");
  await page.screenshot({ path: `${DIR}/05-settings-types.png`, fullPage: true });

  // Roles
  await page.goto("/roles");
  await page.screenshot({ path: `${DIR}/06-roles.png`, fullPage: true });

  // Marathi dashboard
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "mr", exact: true }).click();
  await page.waitForURL(/\/mr(\/|$)/);
  await page.screenshot({ path: `${DIR}/07-dashboard-marathi.png`, fullPage: true });

  // Super admin organizations
  await page.context().clearCookies();
  await loginAsSuperAdmin(page);
  await page.screenshot({
    path: `${DIR}/08-superadmin-organizations.png`,
    fullPage: true,
  });
});
