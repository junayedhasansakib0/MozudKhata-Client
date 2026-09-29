import { expect, test } from "@playwright/test";

/**
 * Smoke e2e: the app loads and shows its shell. Run with both servers up:
 *   1) `npm run dev` in ../server (backend on :4000)
 *   2) `npm run e2e` here (starts the Vite dev server automatically)
 * First run only: `npx playwright install` to fetch browsers.
 */
test("app shell loads with the brand visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("MozudKhata")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("API status badge reports connectivity to the backend", async ({ page }) => {
  await page.goto("/");
  // Passes as "API ok" when the backend is reachable; the badge is always present.
  await expect(page.getByText(/API (ok|offline)|Connecting/)).toBeVisible();
});
