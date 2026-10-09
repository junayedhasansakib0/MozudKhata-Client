import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import type { ProductInput } from "../types";
import {
  __resetCatalog,
  catalogBulkChangeCategory,
  catalogBulkDeactivate,
  catalogBulkUpdatePrice,
  catalogCreate,
  catalogGetById,
  catalogList,
  catalogSetStatus,
  catalogSummary,
  catalogUpdate,
  createBrand,
  createCategory,
  listBrands,
  listCategories,
  removeCategory,
} from "./catalog";

function newProductInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "New Test Product",
    categoryId: "cat_beans",
    status: "active",
    variants: [
      {
        sku: "ZZ-999",
        variantName: "Default",
        costPriceMinor: 500,
        sellPriceMinor: 1200,
        unit: "each",
        attributes: {},
        reorderThreshold: 5,
        reorderQuantity: 20,
        status: "active",
      },
    ],
    ...overrides,
  };
}

describe("mock catalog store", () => {
  beforeEach(() => __resetCatalog());

  it("lists, filters, and paginates products", () => {
    const all = catalogList({ status: "all", pageSize: 100 });
    expect(all.total).toBeGreaterThan(5);

    const beans = catalogList({ categoryId: "cat_beans", status: "all", pageSize: 100 });
    expect(beans.data.every((p) => p.categoryId === "cat_beans")).toBe(true);

    const firstPage = catalogList({ status: "all", pageSize: 3, page: 1 });
    const secondPage = catalogList({ status: "all", pageSize: 3, page: 2 });
    expect(firstPage.data).toHaveLength(3);
    expect(firstPage.data[0]!.id).not.toBe(secondPage.data[0]!.id);
  });

  it("searches by name, SKU, and barcode", () => {
    const bySku = catalogList({ q: "CO-401", status: "all", pageSize: 100 });
    expect(bySku.data.some((p) => p.name.includes("Colombia"))).toBe(true);
  });

  it("sorts by sell price ascending and descending", () => {
    const asc = catalogList({ sort: "sell", status: "all", pageSize: 100 });
    const desc = catalogList({ sort: "-sell", status: "all", pageSize: 100 });
    const minOf = (p: (typeof asc.data)[number]) =>
      Math.min(...p.variants.map((v) => v.sellPrice.amountMinor));
    expect(minOf(asc.data[0]!)).toBeLessThanOrEqual(minOf(asc.data[asc.data.length - 1]!));
    expect(minOf(desc.data[0]!)).toBeGreaterThanOrEqual(minOf(desc.data[desc.data.length - 1]!));
  });

  it("creates a product and rejects duplicate SKUs", () => {
    const created = catalogCreate(newProductInput());
    expect(catalogGetById(created.id)?.name).toBe("New Test Product");
    expect(() => catalogCreate(newProductInput({ name: "Dup" }))).toThrowError(ApiError);
  });

  it("updates a product and toggles status", () => {
    const created = catalogCreate(newProductInput());
    const updated = catalogUpdate(created.id, newProductInput({ name: "Renamed" }));
    expect(updated.name).toBe("Renamed");
    const toggled = catalogSetStatus(created.id, "inactive");
    expect(toggled.status).toBe("inactive");
  });

  it("applies bulk price, category, and deactivate across a selection", () => {
    const a = catalogCreate(newProductInput({ name: "A", variants: newProductInput().variants }));
    const b = catalogCreate(
      newProductInput({
        name: "B",
        variants: [{ ...newProductInput().variants[0]!, sku: "ZZ-998" }],
      }),
    );
    const before = catalogGetById(a.id)!.variants[0]!.sellPrice.amountMinor;

    const priced = catalogBulkUpdatePrice([a.id, b.id], {
      target: "sell",
      mode: "increase_pct",
      value: 10,
    });
    expect(priced).toBe(2);
    expect(catalogGetById(a.id)!.variants[0]!.sellPrice.amountMinor).toBe(Math.round(before * 1.1));

    catalogBulkChangeCategory([a.id], "cat_merch");
    expect(catalogGetById(a.id)!.categoryName).toBe("Merchandise");

    catalogBulkDeactivate([a.id, b.id]);
    expect(catalogGetById(a.id)!.status).toBe("inactive");
    expect(catalogGetById(b.id)!.status).toBe("inactive");
  });

  it("summary reflects totals", () => {
    const summary = catalogSummary();
    expect(summary.totalProducts).toBe(catalogList({ status: "all", pageSize: 1000 }).total);
    expect(summary.totalVariants).toBeGreaterThanOrEqual(summary.totalProducts);
  });

  it("manages categories and brands with product-count guards", () => {
    const category = createCategory({ name: "Seasonal", parentId: null });
    expect(listCategories().some((c) => c.id === category.id)).toBe(true);
    removeCategory(category.id); // empty — allowed
    expect(listCategories().some((c) => c.id === category.id)).toBe(false);
    expect(() => removeCategory("cat_beans")).toThrowError(ApiError); // has products

    const brand = createBrand({ name: "Test Brand" });
    expect(listBrands().some((b) => b.id === brand.id)).toBe(true);
  });
});
