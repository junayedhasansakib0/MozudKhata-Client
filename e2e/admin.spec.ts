import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("staff permission matrix toggles a role permission", async ({ page }) => {
  await signIn(page);
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Staff & Roles" })).toBeVisible();

  await page.getByRole("tab", { name: "Roles & permissions" }).click();
  const checkbox = page.getByRole("checkbox", { name: "Cashier: Process refunds" });
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.click();
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
});

test("stores admin lists and opens the add dialog", async ({ page }) => {
  await signIn(page);
  await page.goto("/stores");
  await expect(page.getByRole("heading", { name: "Stores & Branches" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Downtown Flagship", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Add store" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Add store" })).toBeVisible();
});

test("notifications center marks all read", async ({ page }) => {
  await signIn(page);
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText(/Low stock:/)).toBeVisible();

  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(page.getByRole("button", { name: "Unread (0)" })).toBeVisible();
});

test("settings navigates sections", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Appearance" }).click();
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();

  await page.getByRole("button", { name: "Security" }).click();
  await expect(page.getByRole("button", { name: "Update password" })).toBeVisible();
});
