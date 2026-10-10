import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { SaleOrder } from "@/lib/data/types";
import { RefundDialog } from "./refund-dialog";
import { InvoiceDialog } from "./invoice-dialog";

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

function sampleOrder(): SaleOrder {
  return {
    id: "o1",
    orderNumber: "#9001",
    storeId: "store_downtown",
    storeName: "Downtown Flagship",
    cashierName: "Alex Morgan",
    customerName: "Marcus Vance",
    status: "completed",
    subtotal: { amountMinor: 4000, currency: "USD" },
    discountTotal: { amountMinor: 0, currency: "USD" },
    taxTotal: { amountMinor: 320, currency: "USD" },
    total: { amountMinor: 4320, currency: "USD" },
    amountPaid: { amountMinor: 4320, currency: "USD" },
    refundedTotal: { amountMinor: 0, currency: "USD" },
    currency: "USD",
    createdAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T00:00:00Z",
    items: [
      {
        id: "oi1",
        variantId: "v1",
        sku: "CB-330",
        name: "Cold Brew Bottle",
        quantity: 4,
        unitPrice: { amountMinor: 1000, currency: "USD" },
        discount: { amountMinor: 0, currency: "USD" },
        taxAmount: { amountMinor: 320, currency: "USD" },
        lineTotal: { amountMinor: 4000, currency: "USD" },
        costPriceAtSale: { amountMinor: 500, currency: "USD" },
        quantityRefunded: 0,
      },
    ],
    payments: [{ id: "p1", method: "card", amount: { amountMinor: 4320, currency: "USD" }, createdAt: "" }],
  };
}

describe("RefundDialog", () => {
  it("computes the refund amount from selected quantity and gates on PIN", () => {
    render(withQuery(<RefundDialog open onOpenChange={vi.fn()} order={sampleOrder()} />));

    const process = screen.getByRole("button", { name: "Process refund" });
    expect(process).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Refund quantity for CB-330"), { target: { value: "2" } });
    // unit refund = (4000 + 320)/4 = 1080 → 2 × 1080 = 2160 → $21.60
    expect(screen.getByText("$21.60")).toBeInTheDocument();
    expect(process).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Supervisor PIN"), { target: { value: "1234" } });
    expect(process).toBeEnabled();
  });
});

describe("InvoiceDialog", () => {
  it("renders order lines and total", () => {
    render(<InvoiceDialog open onOpenChange={vi.fn()} order={sampleOrder()} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Invoice #9001")).toBeInTheDocument();
    expect(within(dialog).getByText(/Cold Brew Bottle/)).toBeInTheDocument();
    // Total and the card payment are both $43.20.
    expect(within(dialog).getAllByText("$43.20").length).toBeGreaterThanOrEqual(1);
  });
});
