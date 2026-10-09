import { describe, it, expect } from "vitest";

import type { Product } from "@/lib/data/types";
import {
  applyPriceAdjustment,
  generateVariants,
  marginPct,
  parseCatalogCsv,
  productAvgMarginPct,
  sellRangeMinor,
  stockLevel,
  toCatalogCsv,
  validateImportRows,
} from "./catalog-math";

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Test",
    categoryId: "c1",
    categoryName: "Cat",
    isVariable: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    variants: [
      {
        id: "v1",
        productId: "p1",
        sku: "A-1",
        variantName: "Small",
        costPrice: { amountMinor: 500, currency: "USD" },
        sellPrice: { amountMinor: 1000, currency: "USD" },
        unit: "each",
        attributes: {},
        reorderThreshold: 10,
        reorderQuantity: 24,
        status: "active",
        stockByStore: [{ storeId: "s1", storeName: "Store One", quantity: 5 }],
      },
      {
        id: "v2",
        productId: "p1",
        sku: "A-2",
        variantName: "Large",
        costPrice: { amountMinor: 600, currency: "USD" },
        sellPrice: { amountMinor: 2000, currency: "USD" },
        unit: "each",
        attributes: {},
        reorderThreshold: 10,
        reorderQuantity: 24,
        status: "active",
        stockByStore: [{ storeId: "s1", storeName: "Store One", quantity: 3 }],
      },
    ],
    ...partial,
  };
}

describe("catalog-math pricing", () => {
  it("marginPct computes gross margin, guarding zero sell", () => {
    expect(marginPct(500, 1000)).toBe(50);
    expect(marginPct(600, 2000)).toBe(70);
    expect(marginPct(500, 0)).toBe(0);
  });

  it("applyPriceAdjustment handles every mode and never goes negative", () => {
    expect(applyPriceAdjustment(1000, { target: "sell", mode: "increase_pct", value: 10 })).toBe(1100);
    expect(applyPriceAdjustment(1000, { target: "sell", mode: "decrease_pct", value: 10 })).toBe(900);
    expect(applyPriceAdjustment(1000, { target: "sell", mode: "increase_amount", value: 250 })).toBe(1250);
    expect(applyPriceAdjustment(1000, { target: "sell", mode: "decrease_amount", value: 250 })).toBe(750);
    expect(applyPriceAdjustment(1000, { target: "sell", mode: "set", value: 499 })).toBe(499);
    expect(applyPriceAdjustment(100, { target: "sell", mode: "decrease_amount", value: 500 })).toBe(0);
  });

  it("sellRangeMinor and productAvgMarginPct aggregate variants", () => {
    const product = makeProduct();
    expect(sellRangeMinor(product)).toEqual({ min: 1000, max: 2000 });
    expect(productAvgMarginPct(product)).toBeCloseTo((50 + 70) / 2, 5);
  });

  it("stockLevel classifies out/low/ok", () => {
    expect(stockLevel(0, 10)).toBe("out");
    expect(stockLevel(5, 10)).toBe("low");
    expect(stockLevel(20, 10)).toBe("ok");
  });
});

describe("variant matrix generation", () => {
  it("returns empty when there are no usable options", () => {
    expect(generateVariants([], "SKU")).toEqual([]);
    expect(generateVariants([{ name: "Size", values: [] }], "SKU")).toEqual([]);
  });

  it("builds the cartesian product with names, attributes, and SKU suffixes", () => {
    const result = generateVariants(
      [
        { name: "Size", values: ["12oz", "16oz"] },
        { name: "Color", values: ["Black", "White"] },
      ],
      "MC-100",
    );
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.variantName)).toEqual([
      "12oz / Black",
      "12oz / White",
      "16oz / Black",
      "16oz / White",
    ]);
    expect(result[0]!.attributes).toEqual({ Size: "12oz", Color: "Black" });
    expect(result[0]!.skuSuffix.startsWith("MC-100-")).toBe(true);
  });
});

describe("CSV import/export", () => {
  it("parses CSV with a header row into rows", () => {
    const rows = parseCatalogCsv("name,sku,sell\nWidget,W-1,9.99\nGadget,G-1,4.50");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ line: 2, name: "Widget", sku: "W-1", sell: "9.99" });
  });

  it("validates rows: create vs update, errors, and in-file duplicates", () => {
    const rows = parseCatalogCsv(
      [
        "name,sku,sell",
        "New Item,NEW-1,10.00",
        "Existing,OLD-1,5.00",
        ",BAD-1,notanumber",
        "Dup,NEW-1,1.00",
      ].join("\n"),
    );
    const preview = validateImportRows(rows, new Set(["old-1"]));
    expect(preview.createCount).toBe(1);
    expect(preview.updateCount).toBe(1);
    expect(preview.errorCount).toBe(2);
    expect(preview.results[2]!.issues.length).toBeGreaterThan(0);
    expect(preview.results[3]!.issues.join(" ")).toMatch(/duplicate/i);
  });

  it("exports one CSV row per variant with a header", () => {
    const csv = toCatalogCsv([makeProduct()]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("name,sku");
    expect(lines).toHaveLength(3); // header + 2 variants
    expect(lines[1]).toContain("A-1");
  });
});
