import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a user can sign in and reach the dashboard shell", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

  // Command palette (keyboard-first) works inside the shell.
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByPlaceholder("Search or jump to…")).toBeVisible();
});

test("invalid credentials surface an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Incorrect email or password")).toBeVisible();
});

test("signup → verify email → onboarding → dashboard", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Business name").fill("Mozud Coffee Co.");
  await page.getByLabel("Your name").fill("Alex Morgan");
  await page.getByLabel("Email").fill("founder@mozud.example");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email/);
  await page.getByRole("button", { name: "I've verified my email" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);

  // Step 1 — Business
  await page.getByLabel("Business name").fill("Mozud Coffee Co.");
  await page.getByLabel("Country").selectOption("United States");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — First store
  await page.getByLabel("Store name").fill("Downtown Flagship");
  await page.getByLabel("Store code").fill("AUS-01");
  await page.getByLabel("City").fill("Austin, TX");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — Currency (default USD)
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 4 — Tax (valid defaults)
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 5 — Products (default: skip)
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 6 — Completion
  await page.getByRole("button", { name: "Go to dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("login validation blocks an invalid email", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Enter a valid email")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
