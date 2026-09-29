import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard-page";
import type { DashboardMetrics } from "@/features/dashboard/types";

/** Stub `/dashboard` (apiFetch unwraps `.data`) with the given metrics payload. */
function stubDashboard(metrics: DashboardMetrics) {
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/dashboard")) {
      return new Response(JSON.stringify({ data: metrics }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
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
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage (Phase 07)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the stat metrics and recent activity from the API", async () => {
    stubDashboard({
      totalProducts: 3,
      totalStockUnits: "53",
      lowStockCount: 1,
      outOfStockCount: 2,
      categoryCount: 4,
      recentActivity: [
        {
          id: "m1",
          productId: "p1",
          productName: "Widget",
          type: "IN",
          quantityDelta: "10",
          balanceAfter: "10",
          reason: "restock",
          createdAt: "2026-09-02T10:00:00Z",
        },
      ],
    });
    renderPage();

    expect(await screen.findByText("53")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    // Recent activity feed shows the product name, signed delta, and type badge.
    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("In")).toBeInTheDocument();
  });

  it("shows the get-started empty state when there are no products or categories", async () => {
    stubDashboard({
      totalProducts: 0,
      totalStockUnits: "0",
      lowStockCount: 0,
      outOfStockCount: 0,
      categoryCount: 0,
      recentActivity: [],
    });
    renderPage();

    expect(await screen.findByText("Get started")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add product" })).toBeInTheDocument();
  });
});
