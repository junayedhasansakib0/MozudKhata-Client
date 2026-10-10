import { describe, it, expect } from "vitest";

import type { Expense } from "@/lib/data/types";
import { expensesTotalMinor, totalsByCategory } from "./expense-math";

function exp(category: Expense["category"], minor: number): Expense {
  return {
    id: `e_${category}_${minor}`,
    storeId: "s1",
    storeName: "Store",
    category,
    amount: { amountMinor: minor, currency: "USD" },
    spentAt: "2026-01-01T00:00:00Z",
    createdBy: "Alex",
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("expense-math", () => {
  it("sums totals", () => {
    expect(expensesTotalMinor([exp("rent", 1000), exp("supplies", 500)])).toBe(1500);
  });

  it("groups and sorts by category descending", () => {
    const totals = totalsByCategory([exp("rent", 1000), exp("supplies", 500), exp("rent", 250)]);
    expect(totals[0]).toEqual({ category: "rent", amountMinor: 1250 });
    expect(totals[1]).toEqual({ category: "supplies", amountMinor: 500 });
  });
});
