import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("suppliers directory lists suppliers and opens detail", async ({ page }) => {
  await signIn(page);
  await page.goto("/suppliers");
  await expect(page.getByRole("heading", { name: "Suppliers" })).toBeVisible();

  await expect(page.getByText("Origins Coffee Importers")).toBeVisible();
  await page.getByRole("button", { name: "Origins Coffee Importers" }).click();
  await expect(page.getByRole("heading", { name: "Purchase history" })).toBeVisible();
});

test("purchases shows KPIs and the PO list", async ({ page }) => {
  await signIn(page);
  await page.goto("/purchases");
  await expect(page.getByRole("heading", { name: "Purchases & POs" })).toBeVisible();
  await expect(page.getByText("Open orders")).toBeVisible();
  await expect(page.getByText("Outstanding payables")).toBeVisible();
  await expect(page.getByRole("button", { name: /PO-\d+/ }).first()).toBeVisible();
});

test("creates a purchase order draft", async ({ page }) => {
  await signIn(page);
  await page.goto("/purchases");

  await page.getByRole("button", { name: "New PO" }).click();
  await expect(page.getByText("New purchase order")).toBeVisible();

  await page.getByLabel("Supplier").selectOption({ label: "Origins Coffee Importers" });

  // The variant list loads from the catalog query — wait for options before picking.
  const variantSelect = page.getByLabel("Select variant");
  await expect(variantSelect.locator("option")).not.toHaveCount(1);
  await variantSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Add line" }).click();

  const createBtn = page.getByRole("button", { name: "Create draft" });
  await expect(createBtn).toBeEnabled();
  await createBtn.click();
  await expect(page.getByText("New purchase order")).toBeHidden();
});

test("receives stock against an ordered PO", async ({ page }) => {
  await signIn(page);
  await page.goto("/purchases");

  await page.getByLabel("Filter status").selectOption("ordered");
  await page.getByRole("button", { name: "Receive" }).first().click();

  await expect(page.getByText(/Receive stock — PO-/)).toBeVisible();
  await page.getByRole("button", { name: "Confirm receipt" }).click();
  await expect(page.getByText(/Receive stock — PO-/)).toBeHidden();
});
