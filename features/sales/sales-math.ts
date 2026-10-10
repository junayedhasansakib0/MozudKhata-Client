import type { RefundLineInput, SaleOrder, SaleOrderItem } from "@/lib/data/types";

/**
 * Pure sales/refund math (no React, no I/O). Money is in integer minor units
 * (docs/business-rules.md Sales / Refunds). Shared by the UI and the mock store.
 */

/** Units still eligible for refund on a line. */
export function refundableQty(item: Pick<SaleOrderItem, "quantity" | "quantityRefunded">): number {
  return Math.max(0, item.quantity - item.quantityRefunded);
}

/** Per-unit refund value (line total + line tax, spread over the quantity). */
export function unitRefundMinor(item: SaleOrderItem): number {
  if (item.quantity <= 0) return 0;
  return Math.round((item.lineTotal.amountMinor + item.taxAmount.amountMinor) / item.quantity);
}

/** Total refund (minor units) for the selected lines, capped at refundable quantity. */
export function refundAmountMinor(order: SaleOrder, lines: RefundLineInput[]): number {
  let total = 0;
  for (const line of lines) {
    const item = order.items.find((i) => i.id === line.orderItemId);
    if (!item) continue;
    const qty = Math.min(Math.max(0, Math.round(line.quantity)), refundableQty(item));
    total += qty * unitRefundMinor(item);
  }
  return total;
}

/** Distinct payment methods on an order, e.g. "cash + card". */
export function paymentMethodsSummary(order: SaleOrder): string {
  const methods = [...new Set(order.payments.map((p) => p.method))];
  return methods.length > 0 ? methods.join(" + ").replace(/_/g, " ") : "—";
}

/** Order status implied by refunded quantities across items. */
export function refundStatus(items: SaleOrderItem[]): "refunded" | "partially_refunded" | null {
  const anyRefunded = items.some((i) => i.quantityRefunded > 0);
  if (!anyRefunded) return null;
  const allRefunded = items.every((i) => i.quantityRefunded >= i.quantity);
  return allRefunded ? "refunded" : "partially_refunded";
}
