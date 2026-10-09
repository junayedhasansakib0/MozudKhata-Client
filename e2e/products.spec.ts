import { test, expect, type Page } from "@playwright/test";

async function signInToProducts(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Products & Variants" })).toBeVisible();
}

test("lists catalog products and filters by search", async ({ page }) => {
  await signInToProducts(page);

  await expect(page.getByText("Single Origin Colombia Huila Beans")).toBeVisible();

  await page.getByLabel("Search catalog").fill("Colombia");
  await expect(page.getByText("Single Origin Colombia Huila Beans")).toBeVisible();
  await expect(page.getByText("Masala Chai Concentrate 1L")).toBeHidden();
});

test("expands a multi-variant product to reveal variant rows", async ({ page }) => {
  await signInToProducts(page);

  await page.getByLabel("Search catalog").fill("Ceramic Travel Tumbler");
  await page.getByRole("button", { name: "Expand variants" }).first().click();
  await expect(page.getByText("12oz / Matte Charcoal")).toBeVisible();
});

test("selecting a row reveals the bulk actions bar", async ({ page }) => {
  await signInToProducts(page);

  await page.getByLabel("Search catalog").fill("Colombia");
  await page.getByRole("checkbox", { name: /Select Single Origin Colombia/ }).click();
  await expect(page.getByText("1 product selected")).toBeVisible();
  await expect(page.getByRole("button", { name: "Update price" })).toBeVisible();
});

test("opens the create product drawer", async ({ page }) => {
  await signInToProducts(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByRole("heading", { name: "Create product" })).toBeVisible();
  await expect(page.getByText("Variant matrix setup")).toBeHidden();
  await page.getByRole("tab", { name: "Variants" }).click();
  await expect(page.getByText("Variant matrix setup")).toBeVisible();
});
