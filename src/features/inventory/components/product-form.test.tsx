import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductForm } from "@/features/inventory/components/product-form";

/** Records every fetch call so we can assert whether a mutation was attempted. */
function stubFetch() {
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/categories")) {
      return new Response(JSON.stringify({ data: { categories: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/auth/csrf")) {
      return new Response(JSON.stringify({ data: { csrfToken: "csrf-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    // POST /products
    const method = init?.method ?? "GET";
    void method;
    return new Response(
      JSON.stringify({ data: { product: { id: "p1" } } }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", impl);
  return impl;
}

function renderProductForm() {
  const router = createMemoryRouter(
    [
      { path: "/", element: <ProductForm /> },
      { path: "/products/:id", element: <div>Saved</div> },
    ],
    { initialEntries: ["/"] },
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

function postedToProducts(impl: ReturnType<typeof stubFetch>) {
  return impl.mock.calls.some(([input, init]) => {
    const url = typeof input === "string" ? input : String(input);
    const method = (init as RequestInit | undefined)?.method ?? "GET";
    return url.includes("/products") && method === "POST";
  });
}

describe("ProductForm", () => {
  let fetchImpl: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    fetchImpl = stubFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a name before submitting", async () => {
    const user = userEvent.setup();
    renderProductForm();

    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(postedToProducts(fetchImpl)).toBe(false);
  });

  it("rejects an invalid low-stock threshold", async () => {
    const user = userEvent.setup();
    renderProductForm();

    await user.type(screen.getByLabelText("Name"), "Widget");
    await user.type(screen.getByLabelText("Low-stock threshold (optional)"), "-5");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(
      await screen.findByText("Enter a non-negative number (up to 3 decimals)."),
    ).toBeInTheDocument();
    expect(postedToProducts(fetchImpl)).toBe(false);
  });

  it("submits a valid product and navigates to its detail page", async () => {
    const user = userEvent.setup();
    renderProductForm();

    await user.type(screen.getByLabelText("Name"), "Widget");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
    expect(postedToProducts(fetchImpl)).toBe(true);
  });
});
