import { test } from "@playwright/test";

test("capture pos light + dark", async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/);
  await page.goto("/pos");
  await page.getByRole("button", { name: /Signature Flat White/ }).click();
  await page.getByRole("button", { name: /Cold Brew Nitro 16oz/ }).click();
  await page.getByRole("button", { name: /Almond Croissant/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/pos-light.png", fullPage: true });
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/pos-dark.png", fullPage: true });
});
