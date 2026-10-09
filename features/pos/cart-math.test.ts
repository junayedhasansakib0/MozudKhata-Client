import { describe, it, expect } from "vitest";

import { changeMinor, computeTotals, requiresOverride } from "./cart-math";

const TAX = [{ id: "t", name: "Sales Tax", rate: 0.0825 }];
const lines = [
  { unitPriceMinor: 475, quantity: 2 }, // 950
  { unitPriceMinor: 550, quantity: 1 }, // 550
];

describe("cart-math", () => {
  it("sums subtotal and item count", () => {
    const t = computeTotals({ lines, discount: { kind: "none" }, taxLines: TAX });
    expect(t.subtotalMinor).toBe(1500);
    expect(t.itemCount).toBe(3);
  });

  it("applies tax on the discounted subtotal", () => {
    const t = computeTotals({ lines, discount: { kind: "none" }, taxLines: TAX });
    expect(t.taxTotalMinor).toBe(Math.round(1500 * 0.0825));
    expect(t.totalMinor).toBe(1500 + t.taxTotalMinor);
  });

  it("applies a percentage discount", () => {
    const t = computeTotals({ lines, discount: { kind: "pct", value: 10 }, taxLines: TAX });
    expect(t.manualDiscountMinor).toBe(150);
    expect(t.taxTotalMinor).toBe(Math.round(1350 * 0.0825));
    expect(t.totalMinor).toBe(1350 + t.taxTotalMinor);
  });

  it("applies a flat discount capped at subtotal", () => {
    const t = computeTotals({ lines, discount: { kind: "flat", value: 99999 }, taxLines: TAX });
    expect(t.manualDiscountMinor).toBe(1500);
    expect(t.totalMinor).toBe(0);
  });

  it("stacks loyalty discount after the manual discount", () => {
    const t = computeTotals({
      lines,
      discount: { kind: "pct", value: 10 },
      loyaltyPct: 10,
      taxLines: TAX,
    });
    expect(t.manualDiscountMinor).toBe(150);
    expect(t.loyaltyDiscountMinor).toBe(135); // 10% of 1350
    expect(t.discountTotalMinor).toBe(285);
  });

  it("flags discounts over 20% for supervisor override", () => {
    expect(requiresOverride({ kind: "pct", value: 25 }, 1500)).toBe(true);
    expect(requiresOverride({ kind: "pct", value: 20 }, 1500)).toBe(false);
    expect(requiresOverride({ kind: "flat", value: 450 }, 1500)).toBe(true); // 30%
    expect(requiresOverride({ kind: "none" }, 1500)).toBe(false);
  });

  it("computes change (never negative)", () => {
    expect(changeMinor(2000, 1623)).toBe(377);
    expect(changeMinor(1000, 1623)).toBe(0);
  });
});
