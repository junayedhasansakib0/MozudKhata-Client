import type {
  BulkPriceAdjustment,
  ImportPreview,
  ImportRow,
  ImportRowResult,
  ImportRowStatus,
  Product,
  ProductStatus,
  ProductVariant,
} from "@/lib/data/types";

/**
 * Pure catalog math + transforms (no React, no I/O). Money is in integer minor units
 * (docs/business-rules.md). These helpers are shared by the UI and the mock store and
 * are unit-tested in catalog-math.test.ts.
 */

/** Apply a bulk price adjustment to one amount (minor units). Never negative. */
export function applyPriceAdjustment(currentMinor: number, adj: BulkPriceAdjustment): number {
  let next = currentMinor;
  switch (adj.mode) {
    case "set":
      next = adj.value;
      break;
    case "increase_pct":
      next = currentMinor + (currentMinor * adj.value) / 100;
      break;
    case "decrease_pct":
      next = currentMinor - (currentMinor * adj.value) / 100;
      break;
    case "increase_amount":
      next = currentMinor + adj.value;
      break;
    case "decrease_amount":
      next = currentMinor - adj.value;
      break;
  }
  return Math.max(0, Math.round(next));
}

/** Gross margin percentage from cost/sell (minor units). 0 when sell <= 0. */
export function marginPct(costMinor: number, sellMinor: number): number {
  if (sellMinor <= 0) return 0;
  return ((sellMinor - costMinor) / sellMinor) * 100;
}

export function variantStock(variant: ProductVariant): number {
  return variant.stockByStore.reduce((sum, row) => sum + row.quantity, 0);
}

export function productStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + variantStock(v), 0);
}

function range(values: number[]): { min: number; max: number } {
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function sellRangeMinor(product: Product): { min: number; max: number } {
  return range(product.variants.map((v) => v.sellPrice.amountMinor));
}

export function costRangeMinor(product: Product): { min: number; max: number } {
  return range(product.variants.map((v) => v.costPrice.amountMinor));
}

/** Average gross margin across a product's variants (percentage). */
export function productAvgMarginPct(product: Product): number {
  if (product.variants.length === 0) return 0;
  const sum = product.variants.reduce(
    (acc, v) => acc + marginPct(v.costPrice.amountMinor, v.sellPrice.amountMinor),
    0,
  );
  return sum / product.variants.length;
}

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(onHand: number, threshold: number): StockLevel {
  if (onHand <= 0) return "out";
  if (onHand <= threshold) return "low";
  return "ok";
}

/** Lowest reorder threshold across a product's variants (for the list stock badge). */
export function productStockLevel(product: Product): StockLevel {
  const onHand = productStock(product);
  const threshold = product.variants.reduce((max, v) => Math.max(max, v.reorderThreshold), 0);
  return stockLevel(onHand, threshold);
}

// --- Variant matrix generation --------------------------------------------------

export interface OptionType {
  name: string;
  values: string[];
}

export interface GeneratedVariant {
  variantName: string;
  attributes: Record<string, string>;
  skuSuffix: string;
}

function skuToken(value: string): string {
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return cleaned.slice(0, 4) || "VAR";
}

/**
 * Cartesian product of option values → one generated variant per combination.
 * Options with no name or no values are ignored. Returns [] when there are no usable
 * options (the product keeps its single default variant).
 */
export function generateVariants(options: OptionType[], baseSku = ""): GeneratedVariant[] {
  const usable = options
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length > 0);
  if (usable.length === 0) return [];

  let combos: { label: string; attributes: Record<string, string>; suffix: string }[] = [
    { label: "", attributes: {}, suffix: "" },
  ];
  for (const option of usable) {
    const next: typeof combos = [];
    for (const combo of combos) {
      for (const value of option.values) {
        next.push({
          label: combo.label ? `${combo.label} / ${value}` : value,
          attributes: { ...combo.attributes, [option.name]: value },
          suffix: combo.suffix ? `${combo.suffix}-${skuToken(value)}` : skuToken(value),
        });
      }
    }
    combos = next;
  }

  const prefix = baseSku.trim().toUpperCase();
  return combos.map((combo) => ({
    variantName: combo.label,
    attributes: combo.attributes,
    skuSuffix: prefix ? `${prefix}-${combo.suffix}` : combo.suffix,
  }));
}

// --- CSV import / export --------------------------------------------------------

export const CSV_COLUMNS = [
  "name",
  "sku",
  "barcode",
  "category",
  "brand",
  "cost",
  "sell",
  "unit",
  "status",
] as const;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.map((cell) => cell.trim());
}

/** Parse CSV text into import rows. Header row is required and maps by column name. */
export function parseCatalogCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (col: string) => header.indexOf(col);
  return lines.slice(1).map((line, i) => {
    const cells = splitCsvLine(line);
    const get = (col: string) => {
      const at = idx(col);
      return at >= 0 ? (cells[at] ?? "") : "";
    };
    return {
      line: i + 2,
      name: get("name"),
      sku: get("sku"),
      barcode: get("barcode"),
      category: get("category"),
      brand: get("brand"),
      cost: get("cost"),
      sell: get("sell"),
      unit: get("unit"),
      status: get("status"),
    };
  });
}

function validateRow(row: ImportRow, knownSkus: Set<string>, seen: Set<string>): ImportRowResult {
  const issues: string[] = [];
  if (!row.name) issues.push("Missing product name.");
  const sku = row.sku.trim().toLowerCase();
  if (!sku) issues.push("Missing SKU.");
  const cost = Number(row.cost);
  const sell = Number(row.sell);
  if (row.cost !== "" && (Number.isNaN(cost) || cost < 0)) issues.push("Cost must be a number ≥ 0.");
  if (row.sell === "" || Number.isNaN(sell) || sell < 0) issues.push("Sell price must be a number ≥ 0.");
  if (row.status && !["active", "inactive"].includes(row.status.toLowerCase())) {
    issues.push("Status must be 'active' or 'inactive'.");
  }

  let status: ImportRowStatus;
  if (sku && seen.has(sku)) {
    issues.push("Duplicate SKU in this file.");
    status = "error";
  } else {
    if (sku) seen.add(sku);
    if (issues.length > 0) status = "error";
    else status = knownSkus.has(sku) ? "update" : "create";
  }
  return { row, status, issues };
}

/** Validate parsed rows against the existing catalog SKUs, producing a preview. */
export function validateImportRows(rows: ImportRow[], knownSkus: Set<string>): ImportPreview {
  const seen = new Set<string>();
  const results = rows.map((row) => validateRow(row, knownSkus, seen));
  return {
    results,
    createCount: results.filter((r) => r.status === "create").length,
    updateCount: results.filter((r) => r.status === "update").length,
    errorCount: results.filter((r) => r.status === "error").length,
  };
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize products (one row per variant) to catalog CSV text. */
export function toCatalogCsv(products: Product[]): string {
  const rows: string[] = [CSV_COLUMNS.join(",")];
  for (const product of products) {
    for (const variant of product.variants) {
      rows.push(
        [
          product.variants.length > 1 ? `${product.name} — ${variant.variantName}` : product.name,
          variant.sku,
          variant.barcode ?? "",
          product.categoryName,
          product.brandName ?? "",
          (variant.costPrice.amountMinor / 100).toFixed(2),
          (variant.sellPrice.amountMinor / 100).toFixed(2),
          variant.unit,
          product.status satisfies ProductStatus,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return rows.join("\n");
}

