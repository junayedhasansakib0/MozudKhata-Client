import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryPage } from "./history-page";
import type { MovementRecord } from "@/features/history/types";

/**
 * Stub the two GET endpoints the page reads (both paginated envelopes:
 * `{ data, meta }`): `/movements` (the history) and `/products` (the filter's
 * options). URL substring order matters — check `/movements` first.
 */
function stubHistory(movements: MovementRecord[], total = movements.length) {
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/movements")) {
      return new Response(
        JSON.stringify({
          data: { movements },
          meta: { page: 1, pageSize: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/products")) {
      return new Response(
        JSON.stringify({
          data: { products: [] },
          meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ data: {} }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", impl);
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HistoryPage (Phase 08)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders movement rows with product name, signed delta, and type badge", async () => {
    stubHistory([
      {
        id: "m1",
        productId: "p1",
        productName: "Widget",
        type: "IN",
        quantityDelta: "10",
        balanceAfter: "10",
        reason: "restock",
        actorId: "u1",
        createdAt: "2026-09-02T10:00:00Z",
      },
      {
        id: "m2",
        productId: "p2",
        productName: "Gadget",
        type: "OUT",
        quantityDelta: "-4",
        balanceAfter: "6",
        reason: null,
        actorId: "u1",
        createdAt: "2026-09-01T10:00:00Z",
      },
    ]);
    renderPage();

    expect(await screen.findByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("Gadget")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-4")).toBeInTheDocument();
    // "In"/"Out" also label the type-filter options, so scope the badge
    // assertions to the results table to avoid matching the dropdown.
    const table = within(screen.getByRole("table"));
    expect(table.getByText("In")).toBeInTheDocument();
    expect(table.getByText("Out")).toBeInTheDocument();
  });

  it("shows the empty state when there are no movements", async () => {
    stubHistory([]);
    renderPage();

    expect(await screen.findByText("No stock movements recorded yet.")).toBeInTheDocument();
  });
});
