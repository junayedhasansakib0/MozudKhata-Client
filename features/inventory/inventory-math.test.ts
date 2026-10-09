import { describe, it, expect } from "vitest";

import type { InventoryItem, TransferItem } from "@/lib/data/types";
import {
  adjustmentDelta,
  adjustmentNewBalance,
  availableQty,
  stockLevelKey,
  transferHasDiscrepancy,
  valuationTotals,
} from "./inventory-math";

function item(onHand: number, costMinor: number, sellMinor: number): InventoryItem {
  return {
    variantId: "v",
    productId: "p",
    productName: "P",
    variantName: "Default",
    sku: "S",
    categoryName: "C",
    storeId: "s",
    storeName: "Store",
    onHand,
    reserved: 0,
    available: onHand,
    reorderThreshold: 10,
    reorderQuantity: 20,
    unit: "each",
    costPrice: { amountMinor: costMinor, currency: "USD" },
    sellPrice: { amountMinor: sellMinor, currency: "USD" },
    level: "ok",
  };
}

describe("inventory-math", () => {
  it("available = on-hand − reserved", () => {
    expect(availableQty(20, 3)).toBe(17);
  });

  it("classifies stock level", () => {
    expect(stockLevelKey(0, 10)).toBe("out");
    expect(stockLevelKey(10, 10)).toBe("low");
    expect(stockLevelKey(11, 10)).toBe("ok");
  });

  it("computes adjustment new balance and delta per type", () => {
    expect(adjustmentNewBalance("add", 20, 5)).toBe(25);
    expect(adjustmentNewBalance("remove", 20, 5)).toBe(15);
    expect(adjustmentNewBalance("remove", 3, 5)).toBe(0); // clamp
    expect(adjustmentNewBalance("exact", 20, 8)).toBe(8);

    expect(adjustmentDelta("add", 20, 5)).toBe(5);
    expect(adjustmentDelta("remove", 20, 5)).toBe(-5);
    expect(adjustmentDelta("exact", 20, 8)).toBe(-12);
  });

  it("sums valuation across items (minor units)", () => {
    const totals = valuationTotals([item(10, 500, 1000), item(2, 600, 2000)]);
    expect(totals.costMinor).toBe(10 * 500 + 2 * 600);
    expect(totals.retailMinor).toBe(10 * 1000 + 2 * 2000);
  });

  it("flags a transfer discrepancy when received ≠ shipped", () => {
    const base: TransferItem = {
      variantId: "v",
      sku: "S",
      productName: "P",
      variantName: "Default",
      quantity: 10,
      quantityReceived: 10,
    };
    expect(transferHasDiscrepancy([base])).toBe(false);
    expect(transferHasDiscrepancy([{ ...base, quantityReceived: 8 }])).toBe(true);
  });
});
