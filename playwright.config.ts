import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright end-to-end config. E2E specs live in `e2e/` and run against a
 * live dev server (SPA + backend). Before the first run, install browsers with
 * `npx playwright install`. Start the backend (`npm run dev` in ../server) so
 * the health check has an API to reach; the Vite dev server is started here.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
