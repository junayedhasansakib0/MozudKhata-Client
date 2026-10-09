import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { InventoryItem } from "@/lib/data/types";
import { AdjustmentDrawer } from "./adjustment-drawer";
import { StockTable } from "./stock-table";

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

function sampleItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    variantId: "v1",
    productId: "p1",
    productName: "Ethiopia Guji Beans",
    variantName: "Default",
    sku: "BN-019",
    barcode: "8901240501",
    categoryName: "Whole Bean Coffee",
    storeId: "store_downtown",
    storeName: "Downtown Flagship",
    onHand: 20,
    reserved: 2,
    available: 18,
    binLocation: "A-1",
    reorderThreshold: 15,
    reorderQuantity: 48,
    unit: "bag",
    costPrice: { amountMinor: 1050, currency: "USD" },
    sellPrice: { amountMinor: 1800, currency: "USD" },
    level: "ok",
    ...overrides,
  };
}

describe("AdjustmentDrawer", () => {
  it("gates apply on quantity + supervisor PIN and previews the new balance", () => {
    render(withQuery(<AdjustmentDrawer open onOpenChange={vi.fn()} item={sampleItem()} />));

    const apply = screen.getByRole("button", { name: "Apply adjustment" });
    expect(apply).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    // New on-hand preview reflects +5 on a 20-unit base.
    expect(screen.getByText("(+5)")).toBeInTheDocument();
    expect(apply).toBeDisabled(); // still needs a PIN

    fireEvent.change(screen.getByPlaceholderText("Supervisor PIN"), { target: { value: "1234" } });
    expect(apply).toBeEnabled();
  });

  it("switches to exact-count mode and previews the delta", () => {
    render(withQuery(<AdjustmentDrawer open onOpenChange={vi.fn()} item={sampleItem()} />));
    fireEvent.click(screen.getByRole("button", { name: "= Exact count" }));
    fireEvent.change(screen.getByLabelText("Counted quantity"), { target: { value: "8" } });
    expect(screen.getByText("(-12)")).toBeInTheDocument(); // 8 counted vs 20 on-hand
  });
});

describe("StockTable", () => {
  it("renders rows with status badges and an adjust action", () => {
    const onAdjust = vi.fn();
    render(
      <StockTable
        items={[
          sampleItem(),
          sampleItem({ variantId: "v2", sku: "CB-012", productName: "Filter Mesh", onHand: 0, available: 0, level: "out" }),
        ]}
        onAdjust={onAdjust}
      />,
    );
    expect(screen.getByText("Ethiopia Guji Beans")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Adjust/ })[0]!);
    expect(onAdjust).toHaveBeenCalled();
  });
});
