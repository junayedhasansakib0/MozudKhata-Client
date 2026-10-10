import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("sales list shows KPIs and an invoice", async ({ page }) => {
  await signIn(page);
  await page.goto("/sales");
  await expect(page.getByRole("heading", { name: "Sales & Orders" })).toBeVisible();
  await expect(page.getByText("Gross sales (30d)")).toBeVisible();

  await page.getByRole("button", { name: /^#\d+/ }).first().click();
  await page.getByRole("button", { name: "Invoice" }).click();
  await expect(page.getByText(/Invoice #\d+/)).toBeVisible();
});

test("processes a refund against a completed order", async ({ page }) => {
  await signIn(page);
  await page.goto("/sales");

  await page.getByLabel("Filter status").selectOption("completed");
  await page.getByRole("button", { name: /^#\d+/ }).first().click();
  await page.getByRole("button", { name: "Refund" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").first().fill("1");
  await page.getByPlaceholder("Supervisor PIN").fill("1234");

  const process = page.getByRole("button", { name: "Process refund" });
  await expect(process).toBeEnabled();
  await process.click();
  await expect(page.getByRole("button", { name: "Process refund" })).toBeHidden();
});

test("customers directory opens a detail with history", async ({ page }) => {
  await signIn(page);
  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();

  await expect(page.getByText("Marcus Vance")).toBeVisible();
  await page.getByRole("button", { name: "Marcus Vance" }).click();
  await expect(page.getByRole("heading", { name: "Purchase history" })).toBeVisible();
});
