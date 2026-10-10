import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("records an expense", async ({ page }) => {
  await signIn(page);
  await page.goto("/expenses");
  await expect(page.getByRole("heading", { name: "Expenses & Cashflow" })).toBeVisible();

  await page.getByRole("button", { name: "Record expense" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount").fill("25.00");
  await dialog.getByRole("button", { name: "Record expense" }).click();
  await expect(dialog).toBeHidden();
});

test("reports render and expose an export", async ({ page }) => {
  await signIn(page);
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Analytics & Reports" })).toBeVisible();

  await page.getByRole("tab", { name: "Inventory" }).click();
  await expect(page.getByRole("heading", { name: "Inventory valuation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();

  await page.getByRole("tab", { name: "Tax" }).click();
  await expect(page.getByRole("heading", { name: "Tax collected", exact: true })).toBeVisible();
});
