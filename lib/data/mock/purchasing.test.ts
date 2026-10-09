import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import { __resetCatalog, catalogList } from "./catalog";
import { __resetInventory, inventoryList } from "./inventory";
import {
  __resetPurchasing,
  cancelPurchaseOrder,
  createPurchaseOrder,
  listPurchaseOrders,
  listSuppliers,
  purchaseKpis,
  receivePurchase,
  recordPurchasePayment,
  submitPurchaseOrder,
} from "./purchasing";

const STORE = "store_downtown";

function anyVariantId(): string {
  return catalogList({ status: "all", pageSize: 1000 }).data[0]!.variants[0]!.id;
}

function onHandFor(variantId: string): number {
  return inventoryList({ storeId: STORE, level: "all" }).find((i) => i.variantId === variantId)?.onHand ?? 0;
}

describe("mock purchasing store", () => {
  beforeEach(() => {
    __resetCatalog();
    __resetInventory();
    __resetPurchasing();
  });

  it("lists suppliers with derived order counts and outstanding balances", () => {
    const suppliers = listSuppliers();
    expect(suppliers.length).toBeGreaterThan(0);
    expect(suppliers.some((s) => s.outstanding.amountMinor > 0)).toBe(true);
    expect(suppliers.every((s) => typeof s.orderCount === "number")).toBe(true);
  });

  it("filters purchase orders by status", () => {
    const received = listPurchaseOrders({ status: "received" });
    expect(received.every((o) => o.status === "received")).toBe(true);
  });

  it("runs a PO through draft → ordered → fully received, increasing stock", () => {
    const variantId = anyVariantId();
    const before = onHandFor(variantId);

    const draft = createPurchaseOrder({
      supplierId: "sup_origins",
      storeId: STORE,
      items: [{ variantId, quantityOrdered: 10, unitCostMinor: 500 }],
    });
    expect(draft.status).toBe("draft");
    expect(draft.total.amountMinor).toBe(5000);

    const ordered = submitPurchaseOrder(draft.id);
    expect(ordered.status).toBe("ordered");

    const received = receivePurchase({ id: draft.id, lines: [{ variantId, quantityReceived: 10 }] });
    expect(received.status).toBe("received");
    expect(onHandFor(variantId)).toBe(before + 10);
  });

  it("accumulates partial receipts", () => {
    const variantId = anyVariantId();
    const draft = createPurchaseOrder({
      supplierId: "sup_origins",
      storeId: STORE,
      items: [{ variantId, quantityOrdered: 10, unitCostMinor: 500 }],
    });
    submitPurchaseOrder(draft.id);
    const partial = receivePurchase({ id: draft.id, lines: [{ variantId, quantityReceived: 4 }] });
    expect(partial.status).toBe("partially_received");
    expect(partial.items[0]!.quantityReceived).toBe(4);
    const done = receivePurchase({ id: draft.id, lines: [{ variantId, quantityReceived: 6 }] });
    expect(done.status).toBe("received");
  });

  it("records payments and updates payment status", () => {
    const variantId = anyVariantId();
    const draft = createPurchaseOrder({
      supplierId: "sup_origins",
      storeId: STORE,
      items: [{ variantId, quantityOrdered: 2, unitCostMinor: 1000 }],
    });
    const partial = recordPurchasePayment(draft.id, 500);
    expect(partial.paymentStatus).toBe("partial");
    const paid = recordPurchasePayment(draft.id, 10000); // caps at total
    expect(paid.paymentStatus).toBe("paid");
    expect(paid.amountPaid.amountMinor).toBe(2000);
  });

  it("cancels a draft and rejects invalid POs", () => {
    const variantId = anyVariantId();
    const draft = createPurchaseOrder({
      supplierId: "sup_origins",
      storeId: STORE,
      items: [{ variantId, quantityOrdered: 1, unitCostMinor: 100 }],
    });
    expect(cancelPurchaseOrder(draft.id).status).toBe("cancelled");

    expect(() =>
      createPurchaseOrder({ supplierId: "nope", storeId: STORE, items: [{ variantId, quantityOrdered: 1, unitCostMinor: 1 }] }),
    ).toThrowError(ApiError);
    expect(() => createPurchaseOrder({ supplierId: "sup_origins", storeId: STORE, items: [] })).toThrowError(ApiError);
  });

  it("exposes purchase KPIs", () => {
    const kpis = purchaseKpis();
    expect(kpis.openOrders).toBeGreaterThanOrEqual(1);
    expect(kpis.outstandingPayables.amountMinor).toBeGreaterThanOrEqual(0);
  });
});
