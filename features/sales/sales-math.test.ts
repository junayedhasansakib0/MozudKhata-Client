import { describe, it, expect } from "vitest";

import type { SaleOrder, SaleOrderItem } from "@/lib/data/types";
import {
  paymentMethodsSummary,
  refundableQty,
  refundAmountMinor,
  refundStatus,
  unitRefundMinor,
} from "./sales-math";

function item(partial: Partial<SaleOrderItem> = {}): SaleOrderItem {
  return {
    id: "oi1",
    variantId: "v1",
    sku: "SKU-1",
    name: "Item",
    quantity: 4,
    unitPrice: { amountMinor: 1000, currency: "USD" },
    discount: { amountMinor: 0, currency: "USD" },
    taxAmount: { amountMinor: 320, currency: "USD" }, // 8% on 4000
    lineTotal: { amountMinor: 4000, currency: "USD" },
    costPriceAtSale: { amountMinor: 500, currency: "USD" },
    quantityRefunded: 0,
    ...partial,
  };
}

function order(items: SaleOrderItem[], payments: SaleOrder["payments"] = []): SaleOrder {
  return {
    id: "o1",
    orderNumber: "#9001",
    storeId: "s1",
    storeName: "Store",
    cashierName: "Alex",
    status: "completed",
    subtotal: { amountMinor: 0, currency: "USD" },
    discountTotal: { amountMinor: 0, currency: "USD" },
    taxTotal: { amountMinor: 0, currency: "USD" },
    total: { amountMinor: 0, currency: "USD" },
    amountPaid: { amountMinor: 0, currency: "USD" },
    refundedTotal: { amountMinor: 0, currency: "USD" },
    currency: "USD",
    createdAt: "2026-01-01T00:00:00Z",
    items,
    payments,
  };
}

describe("sales-math", () => {
  it("computes refundable quantity", () => {
    expect(refundableQty(item({ quantity: 4, quantityRefunded: 1 }))).toBe(3);
    expect(refundableQty(item({ quantity: 2, quantityRefunded: 2 }))).toBe(0);
  });

  it("spreads line total + tax across units for the per-unit refund", () => {
    // (4000 + 320) / 4 = 1080
    expect(unitRefundMinor(item())).toBe(1080);
  });

  it("sums refund amount capped at refundable quantity", () => {
    const o = order([item({ id: "a", quantity: 4, quantityRefunded: 1 })]);
    // refundable = 3; request 5 → capped at 3 × 1080
    expect(refundAmountMinor(o, [{ orderItemId: "a", quantity: 5 }])).toBe(3240);
  });

  it("summarizes distinct payment methods", () => {
    const o = order(
      [item()],
      [
        { id: "p1", method: "cash", amount: { amountMinor: 1, currency: "USD" }, createdAt: "" },
        { id: "p2", method: "card", amount: { amountMinor: 1, currency: "USD" }, createdAt: "" },
      ],
    );
    expect(paymentMethodsSummary(o)).toBe("cash + card");
  });

  it("derives refund status from refunded quantities", () => {
    expect(refundStatus([item({ quantityRefunded: 0 })])).toBeNull();
    expect(refundStatus([item({ quantity: 4, quantityRefunded: 2 })])).toBe("partially_refunded");
    expect(refundStatus([item({ quantity: 4, quantityRefunded: 4 })])).toBe("refunded");
  });
});
