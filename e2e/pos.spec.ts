import { test, expect, type Page } from "@playwright/test";

async function signInToPos(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/pos");
  await expect(page.getByRole("button", { name: /Signature Flat White/ })).toBeVisible();
}

test("completes a cash sale end to end", async ({ page }) => {
  await signInToPos(page);

  await page.getByRole("button", { name: /Signature Flat White/ }).click();
  await page.getByRole("button", { name: /Cold Brew Nitro 16oz/ }).click();

  await page.getByRole("button", { name: /Proceed to payment/ }).click();
  await page.getByRole("button", { name: "Add tender" }).click();
  await page.getByRole("button", { name: /Complete sale/ }).click();

  await expect(page.getByText("Payment complete")).toBeVisible();
  await page.getByRole("button", { name: "New sale" }).click();
  await expect(page.getByText("Cart is empty")).toBeVisible();
});

test("holds and recalls an order", async ({ page }) => {
  await signInToPos(page);

  await page.getByRole("button", { name: /Signature Flat White/ }).click();
  await page.getByRole("button", { name: /^Hold/ }).click();
  await expect(page.getByText("Cart is empty")).toBeVisible();

  await page.getByRole("button", { name: /Held orders \(1\)/ }).click();
  await page.getByRole("menuitem", { name: /Signature Flat White/ }).click();

  await expect(page.getByRole("button", { name: /Proceed to payment/ })).toBeEnabled();
});

test("a discount over 20% requires a supervisor override", async ({ page }) => {
  await signInToPos(page);

  await page.getByRole("button", { name: /Signature Flat White/ }).click();
  await page.getByRole("button", { name: /^Discount/ }).click();

  await page.getByPlaceholder("e.g. 10").fill("25");
  await expect(page.getByText("Supervisor override required")).toBeVisible();

  const apply = page.getByRole("button", { name: "Apply discount" });
  await expect(apply).toBeDisabled();
  await page.getByPlaceholder("Supervisor PIN").fill("1234");
  await expect(apply).toBeEnabled();
  await apply.click();

  await expect(page.getByText("Order discount")).toBeHidden();
});
