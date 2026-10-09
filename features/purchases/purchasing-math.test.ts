import { describe, it, expect } from "vitest";

import type { PurchaseOrder } from "@/lib/data/types";
import {
  lineTotalMinor,
  paymentStatus,
  receivedProgress,
  statusAfterReceive,
  supplierOutstandingMinor,
} from "./purchasing-math";

function order(partial: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: "po1",
    poNumber: "PO-1",
    supplierId: "s1",
    supplierName: "Supplier",
    storeId: "st1",
    storeName: "Store",
    status: "ordered",
    paymentStatus: "unpaid",
    subtotal: { amountMinor: 10000, currency: "USD" },
    taxTotal: { amountMinor: 0, currency: "USD" },
    total: { amountMinor: 10000, currency: "USD" },
    amountPaid: { amountMinor: 0, currency: "USD" },
    currency: "USD",
    createdBy: "Alex",
    createdAt: "2026-01-01T00:00:00Z",
    items: [],
    ...partial,
  };
}

describe("purchasing-math", () => {
  it("lineTotalMinor multiplies cost by quantity (clamped)", () => {
    expect(lineTotalMinor(1200, 3)).toBe(3600);
    expect(lineTotalMinor(1200, -2)).toBe(0);
  });

  it("derives payment status", () => {
    expect(paymentStatus(1000, 0)).toBe("unpaid");
    expect(paymentStatus(1000, 400)).toBe("partial");
    expect(paymentStatus(1000, 1000)).toBe("paid");
    expect(paymentStatus(1000, 1200)).toBe("paid");
  });

  it("computes received progress", () => {
    const progress = receivedProgress([
      { quantityOrdered: 10, quantityReceived: 4 },
      { quantityOrdered: 6, quantityReceived: 6 },
    ]);
    expect(progress).toEqual({ received: 10, ordered: 16, pct: 63 });
  });

  it("determines status after receive", () => {
    expect(statusAfterReceive([{ quantityOrdered: 10, quantityReceived: 10 }])).toBe("received");
    expect(statusAfterReceive([{ quantityOrdered: 10, quantityReceived: 4 }])).toBe("partially_received");
  });

  it("sums supplier outstanding across committed orders only", () => {
    const orders = [
      order({ status: "ordered", total: { amountMinor: 10000, currency: "USD" }, amountPaid: { amountMinor: 2000, currency: "USD" } }),
      order({ status: "received", total: { amountMinor: 5000, currency: "USD" }, amountPaid: { amountMinor: 5000, currency: "USD" } }),
      order({ status: "draft", total: { amountMinor: 9999, currency: "USD" }, amountPaid: { amountMinor: 0, currency: "USD" } }),
      order({ status: "cancelled", total: { amountMinor: 9999, currency: "USD" }, amountPaid: { amountMinor: 0, currency: "USD" } }),
    ];
    expect(supplierOutstandingMinor(orders)).toBe(8000); // 10000-2000 only (draft/cancelled excluded, received settled)
  });
});
