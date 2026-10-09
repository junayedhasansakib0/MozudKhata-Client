import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("dashboard renders all overview widgets", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Net profit")).toBeVisible();
  await expect(page.getByText("Gross sales")).toBeVisible();
  await expect(page.getByText("Hourly sales velocity")).toBeVisible();
  await expect(page.getByText("Sales by category")).toBeVisible();
  await expect(page.getByText("Top products")).toBeVisible();
  await expect(page.getByText("Low stock alerts")).toBeVisible();
  await expect(page.getByText("Cash drawer")).toBeVisible();
  await expect(page.getByText("Recent transactions")).toBeVisible();
});

test("the date-range filter updates the KPIs", async ({ page }) => {
  await signIn(page);

  const grossValue = page.locator(".text-kpi").nth(1);
  const before = await grossValue.innerText();

  const thirtyDays = page.getByRole("button", { name: "30 days" });
  await thirtyDays.click();

  await expect(thirtyDays).toHaveAttribute("aria-pressed", "true");
  await expect(grossValue).not.toHaveText(before);
});
