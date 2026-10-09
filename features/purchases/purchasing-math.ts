import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchasePaymentStatus,
  PurchaseStatus,
} from "@/lib/data/types";

/**
 * Pure purchasing math (no React, no I/O). Money is in integer minor units
 * (docs/business-rules.md Purchases). Shared by the UI and the mock store.
 */

export function lineTotalMinor(unitCostMinor: number, quantity: number): number {
  return Math.max(0, Math.round(unitCostMinor)) * Math.max(0, Math.round(quantity));
}

export interface PoLineInput {
  unitCostMinor: number;
  quantity: number;
}

/** Subtotal / tax / total for a set of PO lines, with a tax fraction (e.g. 0.0825). */
// export function poTotals(
//   lines: PoLineInput[],
//   taxRate = 0,
// ): { subtotalMinor: number; taxMinor: number; totalMinor: number } {
//   const subtotalMinor = lines.reduce((sum, l) => sum + lineTotalMinor(l.unitCostMinor, l.quantity), 0);
//   const taxMinor = Math.max(0, Math.round(subtotalMinor * taxRate));
//   return { subtotalMinor, taxMinor, totalMinor: subtotalMinor + taxMinor };
// }

export function paymentStatus(totalMinor: number, paidMinor: number): PurchasePaymentStatus {
  if (paidMinor <= 0) return "unpaid";
  if (paidMinor >= totalMinor) return "paid";
  return "partial";
}

/** Received vs ordered progress across a PO's lines. */
export function receivedProgress(
  items: Pick<PurchaseOrderItem, "quantityOrdered" | "quantityReceived">[],
): {
  received: number;
  ordered: number;
  pct: number;
} {
  const ordered = items.reduce((sum, i) => sum + i.quantityOrdered, 0);
  const received = items.reduce((sum, i) => sum + i.quantityReceived, 0);
  return { received, ordered, pct: ordered === 0 ? 0 : Math.round((received / ordered) * 100) };
}

/** Status implied by receipts: fully received, partially received, or unchanged. */
export function statusAfterReceive(
  items: Pick<PurchaseOrderItem, "quantityOrdered" | "quantityReceived">[],
): Extract<PurchaseStatus, "partially_received" | "received"> {
  const complete = items.every((i) => i.quantityReceived >= i.quantityOrdered);
  return complete ? "received" : "partially_received";
}

/** Outstanding payable across orders: non-cancelled, committed POs' unpaid remainder. */
export function supplierOutstandingMinor(orders: PurchaseOrder[]): number {
  return orders
    .filter(
      (o) => o.status === "ordered" || o.status === "partially_received" || o.status === "received",
    )
    .reduce((sum, o) => sum + Math.max(0, o.total.amountMinor - o.amountPaid.amountMinor), 0);
}
