import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseOrder } from "@/lib/data/types";
import { ReceivePoDialog } from "./receive-po-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { PoFormDialog } from "./po-form-dialog";

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

function sampleOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: "po1",
    poNumber: "PO-4120",
    supplierId: "s1",
    supplierName: "Origins Coffee",
    storeId: "store_downtown",
    storeName: "Downtown Flagship",
    status: "ordered",
    paymentStatus: "unpaid",
    subtotal: { amountMinor: 10000, currency: "USD" },
    taxTotal: { amountMinor: 0, currency: "USD" },
    total: { amountMinor: 10000, currency: "USD" },
    amountPaid: { amountMinor: 2500, currency: "USD" },
    currency: "USD",
    createdBy: "Alex",
    createdAt: "2026-01-01T00:00:00Z",
    items: [
      {
        variantId: "v1",
        sku: "CO-401",
        productName: "Colombia Huila",
        variantName: "Default",
        quantityOrdered: 10,
        quantityReceived: 4,
        unitCost: { amountMinor: 1000, currency: "USD" },
        lineTotal: { amountMinor: 10000, currency: "USD" },
      },
    ],
    ...overrides,
  };
}

describe("ReceivePoDialog", () => {
  it("defaults each line to the remaining quantity", () => {
    render(withQuery(<ReceivePoDialog open onOpenChange={vi.fn()} order={sampleOrder()} />));
    const input = screen.getByLabelText("Receive quantity for CO-401") as HTMLInputElement;
    expect(input.value).toBe("6"); // 10 ordered − 4 already received
    expect(screen.getByText(/Receive stock — PO-4120/)).toBeInTheDocument();
  });
});

describe("RecordPaymentDialog", () => {
  it("defaults the amount to the balance due", () => {
    render(withQuery(<RecordPaymentDialog open onOpenChange={vi.fn()} order={sampleOrder()} />));
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("75.00"); // (10000 − 2500) / 100
  });
});

describe("PoFormDialog", () => {
  it("renders the builder with an empty subtotal", () => {
    render(
      withQuery(
        <PoFormDialog
          open
          onOpenChange={vi.fn()}
          stores={[{ id: "store_downtown", name: "Downtown Flagship", code: "AUS-01", city: "Austin", currency: "USD", status: "active" }]}
          defaultStoreId="store_downtown"
        />,
      ),
    );
    expect(screen.getByText("New purchase order")).toBeInTheDocument();
    expect(screen.getByText("No items added yet.")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });
});
