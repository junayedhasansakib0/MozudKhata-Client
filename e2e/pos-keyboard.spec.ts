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

test("adds a product to the cart with keyboard only via search", async ({ page }) => {
  await signInToPos(page);

  // '/' focuses the product search (PRD §3) without typing a literal slash.
  await page.keyboard.press("/");
  await page.keyboard.type("Signature Flat White");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: /Proceed to payment/ })).toBeEnabled();
});

test("F9 fast-cash then Enter completes the sale (does not delete the tender)", async ({
  page,
}) => {
  await signInToPos(page);

  await page.getByRole("button", { name: /Signature Flat White/ }).click();

  // Fast cash seeds a settled cash tender and opens the payment dialog with focus on
  // the primary action, so Enter must complete the sale — never remove the tender.
  await page.keyboard.press("F9");
  await expect(page.getByRole("button", { name: /Complete sale/ })).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page.getByText("Payment complete")).toBeVisible();
});

test("Escape closes the payment dialog", async ({ page }) => {
  await signInToPos(page);

  await page.getByRole("button", { name: /Signature Flat White/ }).click();
  await page.keyboard.press("F9");
  await expect(page.getByRole("button", { name: /Complete sale/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Complete sale/ })).toBeHidden();
});
