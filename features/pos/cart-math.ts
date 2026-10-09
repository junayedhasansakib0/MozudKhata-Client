import type { TaxLine } from "@/lib/data/types";

export interface CartLineLike {
  unitPriceMinor: number;
  quantity: number;
}

export type OrderDiscount =
  | { kind: "none" }
  | { kind: "pct"; value: number } // 0..100
  | { kind: "flat"; value: number }; // minor units

export interface CartTotals {
  itemCount: number;
  subtotalMinor: number;
  manualDiscountMinor: number;
  loyaltyDiscountMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
}

export const OVERRIDE_DISCOUNT_PCT = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Effective percentage a discount represents against the subtotal. */
export function discountPct(discount: OrderDiscount, subtotalMinor: number): number {
  if (discount.kind === "pct") return discount.value;
  if (discount.kind === "flat") {
    return subtotalMinor > 0 ? (discount.value / subtotalMinor) * 100 : 0;
  }
  return 0;
}

/** Business rule: discounts over 20% require a supervisor override (PRD §5). */
export function requiresOverride(discount: OrderDiscount, subtotalMinor: number): boolean {
  return discountPct(discount, subtotalMinor) > OVERRIDE_DISCOUNT_PCT + 1e-9;
}

export function computeTotals(params: {
  lines: CartLineLike[];
  discount: OrderDiscount;
  loyaltyPct?: number;
  taxLines: TaxLine[];
}): CartTotals {
  const { lines, discount, loyaltyPct = 0, taxLines } = params;
  const itemCount = lines.reduce((n, line) => n + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);

  let manual = 0;
  if (discount.kind === "pct") {
    manual = Math.round(subtotal * (clamp(discount.value, 0, 100) / 100));
  } else if (discount.kind === "flat") {
    manual = clamp(discount.value, 0, subtotal);
  }

  const afterManual = subtotal - manual;
  const loyalty = Math.round(afterManual * (clamp(loyaltyPct, 0, 100) / 100));
  const discountTotal = manual + loyalty;
  const discountedSubtotal = subtotal - discountTotal;
  const taxTotal = taxLines.reduce((sum, t) => sum + Math.round(discountedSubtotal * t.rate), 0);
  const total = discountedSubtotal + taxTotal;

  return {
    itemCount,
    subtotalMinor: subtotal,
    manualDiscountMinor: manual,
    loyaltyDiscountMinor: loyalty,
    discountTotalMinor: discountTotal,
    taxTotalMinor: taxTotal,
    totalMinor: total,
  };
}

export function changeMinor(paidMinor: number, totalMinor: number): number {
  return Math.max(0, paidMinor - totalMinor);
}
