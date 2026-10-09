import type {
  AdjustmentType,
  InventoryItem,
  StockLevelKey,
  TransferItem,
} from "@/lib/data/types";

/**
 * Pure inventory math (no React, no I/O). Quantities are whole units; money is in
 * integer minor units (docs/business-rules.md). Shared by the UI and the mock store.
 */

export function availableQty(onHand: number, reserved: number): number {
  return onHand - reserved;
}

/** out at 0; low at/below the reorder threshold; otherwise ok. */
export function stockLevelKey(onHand: number, reorderThreshold: number): StockLevelKey {
  if (onHand <= 0) return "out";
  if (onHand <= reorderThreshold) return "low";
  return "ok";
}

/** Resulting on-hand after an adjustment (never negative). */
export function adjustmentNewBalance(
  type: AdjustmentType,
  currentOnHand: number,
  quantity: number,
): number {
  const q = Math.max(0, Math.round(quantity));
  switch (type) {
    case "add":
      return currentOnHand + q;
    case "remove":
      return Math.max(0, currentOnHand - q);
    case "exact":
      return q;
  }
}

/** Signed ledger delta for an adjustment (new balance − current). */
export function adjustmentDelta(
  type: AdjustmentType,
  currentOnHand: number,
  quantity: number,
): number {
  return adjustmentNewBalance(type, currentOnHand, quantity) - currentOnHand;
}

export function valuationTotals(items: InventoryItem[]): { costMinor: number; retailMinor: number } {
  return items.reduce(
    (acc, item) => ({
      costMinor: acc.costMinor + item.onHand * item.costPrice.amountMinor,
      retailMinor: acc.retailMinor + item.onHand * item.sellPrice.amountMinor,
    }),
    { costMinor: 0, retailMinor: 0 },
  );
}

/** A received transfer has a discrepancy if any line's received ≠ shipped quantity. */
export function transferHasDiscrepancy(items: TransferItem[]): boolean {
  return items.some((item) => item.quantityReceived !== item.quantity);
}
