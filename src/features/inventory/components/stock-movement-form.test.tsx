import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StockMovementForm } from "@/features/inventory/components/stock-movement-form";
import type { Product } from "@/features/inventory/types";

const product: Product = {
  id: "p1",
  name: "Widget",
  sku: null,
  unit: "pcs",
  categoryId: null,
  category: null,
  quantity: "5",
  lowStockThreshold: "0",
  stockStatus: "IN_STOCK",
  description: null,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/** Records every fetch call so we can assert whether a movement was posted. */
function stubFetch() {
  const impl = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    void _init;
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/auth/csrf")) {
      return new Response(JSON.stringify({ data: { csrfToken: "csrf-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    // POST /products/:id/movements
    return new Response(
      JSON.stringify({
        data: {
          movement: {
            id: "m1",
            productId: "p1",
            type: "IN",
            quantityDelta: "5",
            balanceAfter: "10",
            reason: null,
            actorId: "u1",
            createdAt: "2026-01-02T00:00:00.000Z",
          },
        },
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", impl);
  return impl;
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StockMovementForm product={product} />
    </QueryClientProvider>,
  );
}

function postedMovement(impl: ReturnType<typeof stubFetch>) {
  return impl.mock.calls.some(([input, init]) => {
    const url = typeof input === "string" ? input : String(input);
    const method = (init as RequestInit | undefined)?.method ?? "GET";
    return url.includes("/movements") && method === "POST";
  });
}

describe("StockMovementForm", () => {
  let fetchImpl: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    fetchImpl = stubFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a quantity before submitting", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Record movement" }));

    expect(await screen.findByText("Quantity is required.")).toBeInTheDocument();
    expect(postedMovement(fetchImpl)).toBe(false);
  });

  it("blocks an OUT movement that exceeds the quantity on hand", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("Movement type"), "OUT");
    await user.type(screen.getByLabelText(/Quantity/), "10");
    await user.click(screen.getByRole("button", { name: "Record movement" }));

    expect(await screen.findByText("Only 5 pcs on hand.")).toBeInTheDocument();
    expect(postedMovement(fetchImpl)).toBe(false);
  });

  it("records a valid IN movement", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Quantity/), "5");
    await user.click(screen.getByRole("button", { name: "Record movement" }));

    await waitFor(() => expect(postedMovement(fetchImpl)).toBe(true));
  });
});
