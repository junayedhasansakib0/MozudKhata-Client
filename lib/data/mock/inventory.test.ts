import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import { __resetCatalog, catalogList } from "./catalog";
import {
  __resetInventory,
  cancelTransfer,
  createAdjustment,
  createTransfer,
  inventoryKpis,
  inventoryList,
  listMovements,
  listTransfers,
  receiveTransfer,
  shipTransfer,
} from "./inventory";

const STORE = "store_downtown";

function firstVariantId(): string {
  const products = catalogList({ status: "all", pageSize: 1000 }).data;
  return products[0]!.variants[0]!.id;
}

describe("mock inventory store", () => {
  beforeEach(() => {
    __resetCatalog();
    __resetInventory();
  });

  it("lists stock items for a store and filters by level", () => {
    const all = inventoryList({ storeId: STORE, level: "all" });
    expect(all.length).toBeGreaterThan(0);
    const out = inventoryList({ storeId: STORE, level: "out" });
    expect(out.every((i) => i.level === "out")).toBe(true);
  });

  it("computes KPIs with valuation and counts", () => {
    const kpis = inventoryKpis(STORE);
    expect(kpis.valuationCost.amountMinor).toBeGreaterThan(0);
    expect(kpis.valuationRetail.amountMinor).toBeGreaterThanOrEqual(kpis.valuationCost.amountMinor);
    expect(kpis.inStock + kpis.low + kpis.out).toBe(
      inventoryList({ storeId: STORE, level: "all" }).length,
    );
    expect(kpis.inTransit).toBeGreaterThanOrEqual(1); // one seeded in-transit transfer
  });

  it("applies an adjustment, mutating stock and appending a movement", () => {
    const variantId = firstVariantId();
    const before = inventoryList({ storeId: STORE, level: "all" }).find((i) => i.variantId === variantId)!;
    const beforeCount = listMovements({ storeId: STORE }).length;

    const movement = createAdjustment({
      variantId,
      storeId: STORE,
      type: "add",
      quantity: 7,
      reason: "received",
      note: "restock",
      supervisorPin: "1234",
    });

    expect(movement.quantityDelta).toBe(7);
    expect(movement.balanceAfter).toBe(before.onHand + 7);
    const after = inventoryList({ storeId: STORE, level: "all" }).find((i) => i.variantId === variantId)!;
    expect(after.onHand).toBe(before.onHand + 7);
    expect(listMovements({ storeId: STORE }).length).toBe(beforeCount + 1); // append-only
  });

  it("requires a supervisor PIN for adjustments", () => {
    expect(() =>
      createAdjustment({
        variantId: firstVariantId(),
        storeId: STORE,
        type: "add",
        quantity: 1,
        reason: "other",
        supervisorPin: "",
      }),
    ).toThrowError(ApiError);
  });

  it("runs a transfer through draft → ship → receive with discrepancy flagging", () => {
    const variantId = firstVariantId();
    const sourceBefore = inventoryList({ storeId: "store_north", level: "all" }).find(
      (i) => i.variantId === variantId,
    )!;

    const draft = createTransfer({
      fromStoreId: "store_north",
      toStoreId: STORE,
      items: [{ variantId, quantity: 4 }],
    });
    expect(draft.status).toBe("draft");

    const shipped = shipTransfer(draft.id);
    expect(shipped.status).toBe("in_transit");
    const sourceAfterShip = inventoryList({ storeId: "store_north", level: "all" }).find(
      (i) => i.variantId === variantId,
    )!;
    expect(sourceAfterShip.onHand).toBe(sourceBefore.onHand - 4);

    const destBefore = inventoryList({ storeId: STORE, level: "all" }).find(
      (i) => i.variantId === variantId,
    )!;
    const received = receiveTransfer({ id: draft.id, received: [{ variantId, quantityReceived: 3 }] });
    expect(received.status).toBe("received");
    expect(received.hasDiscrepancy).toBe(true); // 3 received vs 4 shipped
    const destAfter = inventoryList({ storeId: STORE, level: "all" }).find(
      (i) => i.variantId === variantId,
    )!;
    expect(destAfter.onHand).toBe(destBefore.onHand + 3);
  });

  it("cancels a draft transfer", () => {
    const variantId = firstVariantId();
    const draft = createTransfer({
      fromStoreId: "store_north",
      toStoreId: STORE,
      items: [{ variantId, quantity: 2 }],
    });
    const cancelled = cancelTransfer(draft.id);
    expect(cancelled.status).toBe("cancelled");
    expect(listTransfers().some((t) => t.id === draft.id && t.status === "cancelled")).toBe(true);
  });

  it("rejects a transfer with identical source and destination", () => {
    expect(() =>
      createTransfer({ fromStoreId: STORE, toStoreId: STORE, items: [{ variantId: firstVariantId(), quantity: 1 }] }),
    ).toThrowError(ApiError);
  });
});
