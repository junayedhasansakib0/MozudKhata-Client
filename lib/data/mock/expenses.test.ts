import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import {
  __resetExpenses,
  createExpense,
  expenseKpis,
  listExpenses,
  removeExpense,
  updateExpense,
} from "./expenses";

describe("mock expenses store", () => {
  beforeEach(() => __resetExpenses());

  it("lists and filters by category", () => {
    expect(listExpenses().length).toBeGreaterThan(0);
    const rent = listExpenses({ category: "rent" });
    expect(rent.every((e) => e.category === "rent")).toBe(true);
  });

  it("creates, updates, and removes an expense", () => {
    const created = createExpense({ storeId: "store_downtown", category: "marketing", amountMinor: 5000, description: "Ads", spentAt: new Date().toISOString() });
    expect(listExpenses().some((e) => e.id === created.id)).toBe(true);
    const updated = updateExpense(created.id, { storeId: "store_downtown", category: "marketing", amountMinor: 7000, spentAt: created.spentAt });
    expect(updated.amount.amountMinor).toBe(7000);
    removeExpense(created.id);
    expect(listExpenses().some((e) => e.id === created.id)).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(() => createExpense({ storeId: "store_downtown", category: "other", amountMinor: 0, spentAt: new Date().toISOString() })).toThrowError(ApiError);
  });

  it("reports KPIs with a top category", () => {
    const kpis = expenseKpis();
    expect(kpis.totalThisPeriod.amountMinor).toBeGreaterThan(0);
    expect(kpis.topCategory).not.toBeNull();
  });
});
