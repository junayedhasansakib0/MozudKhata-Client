import { test, expect, type Page } from "@playwright/test";

import { expectNoA11yViolations } from "./axe-helper";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// Core authenticated surfaces audited for accessibility and layout.
const ROUTES = [
  "/dashboard",
  "/pos",
  "/products",
  "/inventory",
  "/sales",
  "/purchases",
  "/customers",
  "/suppliers",
  "/expenses",
  "/reports",
  "/staff",
  "/stores",
  "/settings",
  "/notifications",
];

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
  }, theme);
}

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const route of ROUTES) {
      test(`${route} has no serious a11y violations (${theme})`, async ({ page }, testInfo) => {
        await signIn(page);
        await setTheme(page, theme);
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await expectNoA11yViolations(page, testInfo);
      });
    }
  }
});

test.describe("no console errors", () => {
  for (const route of ROUTES) {
    test(`${route} loads without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));
      await signIn(page);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      // Ignore dev-only React DevTools suggestion and HMR noise.
      const meaningful = errors.filter((e) => !/React DevTools|\[Fast Refresh\]|hydrat/i.test(e));
      expect(meaningful, meaningful.join("\n")).toEqual([]);
    });
  }
});

test.describe("responsive — no horizontal page scroll at 390px", () => {
  for (const route of ROUTES) {
    test(`${route} fits a 390px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 780 });
      await signIn(page);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      // Allow a 1px rounding tolerance.
      expect(overflow, `horizontal overflow of ${overflow}px on ${route}`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("RTL smoke", () => {
  for (const route of ["/dashboard", "/pos", "/products", "/sales"]) {
    test(`${route} renders in RTL without horizontal overflow`, async ({ page }) => {
      await signIn(page);
      await page.goto(route);
      await page.evaluate(() => {
        document.documentElement.setAttribute("dir", "rtl");
      });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `RTL horizontal overflow of ${overflow}px on ${route}`).toBeLessThanOrEqual(
        1,
      );
    });
  }
});
