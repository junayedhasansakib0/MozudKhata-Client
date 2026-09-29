import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsPage } from "./products-page";

/** Records product-list request URLs so we can assert the query params sent. */
function stubFetch() {
  const productCalls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/categories")) {
      return new Response(JSON.stringify({ data: { categories: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/products")) productCalls.push(url);
    return new Response(
      JSON.stringify({
        data: { products: [] },
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", impl);
  return { productCalls };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProductsPage filters (Phase 06)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the search, category, status, and sort controls", async () => {
    stubFetch();
    renderPage();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Stock status")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
  });

  it("requests the list with a stock-status filter when one is chosen", async () => {
    const { productCalls } = stubFetch();
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("Stock status"), "LOW");

    await waitFor(() =>
      expect(productCalls.some((u) => u.includes("stockStatus=LOW"))).toBe(true),
    );
  });
});
