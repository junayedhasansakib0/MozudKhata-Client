import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import { __resetCatalog } from "./catalog";
import { __resetCustomers, getCustomer } from "./customers";
import { __resetInventory, inventoryList } from "./inventory";
import { __resetSales, createRefund, listOrders, salesKpis } from "./sales";

function onHand(variantId: string): number {
  return inventoryList({ storeId: "store_downtown", level: "all" }).find((i) => i.variantId === variantId)?.onHand ?? 0;
}

describe("mock sales store", () => {
  beforeEach(() => {
    __resetCatalog();
    __resetInventory();
    __resetCustomers();
    __resetSales();
  });

  it("lists orders and filters by status", () => {
    expect(listOrders().length).toBeGreaterThan(0);
    const refunded = listOrders({ status: "refunded" });
    expect(refunded.every((o) => o.status === "refunded")).toBe(true);
  });

  it("processes a partial refund: updates status, refunded qty, and restocks", () => {
    const order = listOrders({ status: "completed" }).find((o) => o.items.some((i) => i.quantity >= 1))!;
    const item = order.items[0]!;
    const before = onHand(item.variantId);

    const refund = createRefund({
      orderId: order.id,
      lines: [{ orderItemId: item.id, quantity: 1 }],
      reason: "customer_return",
      method: "card",
      restock: true,
      supervisorPin: "1234",
    });

    expect(refund.amount.amountMinor).toBeGreaterThan(0);
    expect(onHand(item.variantId)).toBe(before + 1); // sale_return restock
    const updated = listOrders().find((o) => o.id === order.id)!;
    expect(updated.items.find((i) => i.id === item.id)!.quantityRefunded).toBe(1);
    expect(["partially_refunded", "refunded"]).toContain(updated.status);
  });

  it("does not restock when the restock flag is off", () => {
    const order = listOrders({ status: "completed" })[0]!;
    const item = order.items[0]!;
    const before = onHand(item.variantId);
    createRefund({
      orderId: order.id,
      lines: [{ orderItemId: item.id, quantity: 1 }],
      reason: "damaged",
      method: "card",
      restock: false,
      supervisorPin: "1234",
    });
    expect(onHand(item.variantId)).toBe(before);
  });

  it("refunding to house credit reduces the customer balance", () => {
    const order = listOrders().find((o) => o.customerId === "c_marcus")!;
    const item = order.items[0]!;
    const before = getCustomer("c_marcus")!.balance.amountMinor;
    const refund = createRefund({
      orderId: order.id,
      lines: [{ orderItemId: item.id, quantity: 1 }],
      reason: "customer_return",
      method: "house_credit",
      restock: true,
      supervisorPin: "1234",
    });
    expect(getCustomer("c_marcus")!.balance.amountMinor).toBe(before - refund.amount.amountMinor);
  });

  it("requires a supervisor PIN and at least one line", () => {
    const order = listOrders({ status: "completed" })[0]!;
    expect(() =>
      createRefund({ orderId: order.id, lines: [{ orderItemId: order.items[0]!.id, quantity: 1 }], reason: "other", method: "cash", restock: false, supervisorPin: "" }),
    ).toThrowError(ApiError);
    expect(() =>
      createRefund({ orderId: order.id, lines: [], reason: "other", method: "cash", restock: false, supervisorPin: "1234" }),
    ).toThrowError(ApiError);
  });

  it("reports sales KPIs", () => {
    const kpis = salesKpis("store_downtown");
    expect(kpis.orderCount).toBeGreaterThan(0);
    expect(kpis.grossSales.amountMinor).toBeGreaterThan(0);
  });
});
