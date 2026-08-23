import { defineConfig, devices } from "@playwright/test";

// E2E runs against the TEST database (mandal_crm_test) on an isolated port so it
// never touches the real dev data. globalSetup seeds the test DB first.
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `dotenv -e .env.test -- next dev -p ${PORT}`,
    url: `${BASE}/login`,
    reuseExistingServer: true,
    timeout: 180000,
  },
});
