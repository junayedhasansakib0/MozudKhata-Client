import { test, expect, type Page } from "@playwright/test";

async function signInToInventory(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory & Stock" })).toBeVisible();
}

test("shows inventory KPIs and the stock list", async ({ page }) => {
  await signInToInventory(page);
  await expect(page.getByText("Stock valuation")).toBeVisible();
  await expect(page.getByText("In-transit")).toBeVisible();
  await expect(page.getByRole("button", { name: /Adjust/ }).first()).toBeVisible();
});

test("adjusts stock through the adjustment drawer", async ({ page }) => {
  await signInToInventory(page);

  await page.getByLabel("Search stock").fill("Ethiopia");
  await page.getByRole("button", { name: /Adjust/ }).first().click();

  const drawerTitle = page.getByRole("heading", { name: "Stock adjustment" });
  await expect(drawerTitle).toBeVisible();
  await page.getByLabel("Quantity").fill("5");
  await page.getByPlaceholder("Supervisor PIN").fill("1234");

  const apply = page.getByRole("button", { name: "Apply adjustment" });
  await expect(apply).toBeEnabled();
  await apply.click();

  await expect(drawerTitle).toBeHidden();
});

test("navigates transfers and the movement ledger tabs", async ({ page }) => {
  await signInToInventory(page);

  await page.getByRole("tab", { name: "Transfers" }).click();
  await expect(page.getByRole("button", { name: "New transfer" })).toBeVisible();

  await page.getByRole("tab", { name: "Movement ledger" }).click();
  await expect(page.getByLabel("Filter movement type")).toBeVisible();
});
