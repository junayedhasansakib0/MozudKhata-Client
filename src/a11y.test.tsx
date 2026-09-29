import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/features/auth/components/login-form";

function renderWithProviders(element: ReactElement, path = "/") {
  const router = createMemoryRouter(
    [{ path: "/", element }, { path: "/login", element }],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("accessibility regressions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // A validation error must be programmatically linked to its field via
  // aria-describedby so screen readers announce it (WCAG 3.3.1 / 4.1.3).
  it("links each form field to its error message via aria-describedby", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, "/login");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const email = await screen.findByLabelText("Email");
    const emailErrorId = email.getAttribute("aria-describedby");
    expect(emailErrorId).toBeTruthy();
    expect(document.getElementById(emailErrorId!)).toHaveTextContent("Email is required.");

    const password = screen.getByLabelText("Password");
    const passwordErrorId = password.getAttribute("aria-describedby");
    expect(passwordErrorId).toBeTruthy();
    expect(document.getElementById(passwordErrorId!)).toHaveTextContent("Password is required.");
  });

  // A keyboard user must be able to jump past the nav to the main content.
  it("renders a skip link that targets the main region", () => {
    renderWithProviders(<AppShell />);

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");

    const main = document.getElementById("main");
    expect(main?.tagName).toBe("MAIN");
  });
});
