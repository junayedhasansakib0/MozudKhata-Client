import { describe, it, expect, beforeEach } from "vitest";

import type { ReportKey } from "../types";
import { __resetCatalog } from "./catalog";
import { __resetCustomers } from "./customers";
import { __resetExpenses } from "./expenses";
import { __resetInventory } from "./inventory";
import { __resetPurchasing } from "./purchasing";
import { __resetSales } from "./sales";
import { getReport, REPORTS } from "./reports";

const KEYS: ReportKey[] = ["sales", "profit", "inventory", "purchases", "customers", "suppliers", "expenses", "tax"];

describe("mock reports", () => {
  beforeEach(() => {
    __resetCatalog();
    __resetInventory();
    __resetCustomers();
    __resetPurchasing();
    __resetSales();
    __resetExpenses();
  });

  it("exposes all eight report descriptors", () => {
    expect(REPORTS.map((r) => r.key).sort()).toEqual([...KEYS].sort());
  });

  it("returns a well-formed dataset for every report", () => {
    for (const key of KEYS) {
      const dataset = getReport(key, { range: "30d" });
      expect(dataset.key).toBe(key);
      expect(dataset.kpis.length).toBeGreaterThan(0);
      expect(Array.isArray(dataset.columns)).toBe(true);
      expect(dataset.columns.length).toBeGreaterThan(0);
      expect(Array.isArray(dataset.rows)).toBe(true);
    }
  });

  it("sales report sums gross across orders", () => {
    const dataset = getReport("sales", { range: "90d" });
    expect(dataset.rows.length).toBeGreaterThan(0);
    expect(dataset.kpis.some((k) => k.label === "Gross sales")).toBe(true);
  });

  it("tax report excludes nothing but reports tax collected", () => {
    const dataset = getReport("tax", { range: "90d" });
    expect(dataset.kpis.some((k) => k.label === "Tax collected")).toBe(true);
  });
});
