import type {
  Brand,
  BulkPriceAdjustment,
  CatalogSummary,
  Category,
  Id,
  PageResult,
  Product,
  ProductInput,
  ProductListParams,
  ProductStatus,
  ProductVariant,
  TaxRateConfig,
  VariantInput,
  VariantStoreStock,
} from "../types";
import { ApiError } from "../errors";
import { seedStores } from "./seed";
import { applyPriceAdjustment } from "@/features/products/catalog-math";

/**
 * Mutable in-memory catalog for Stage 1. Unlike the read-only dashboard/POS seed, the
 * catalog supports CRUD + bulk actions so the UI reflects edits across refetches.
 * Removed entirely during Stage 3 integration. Not production data.
 */

const CURRENCY = "USD";
const STOCK_STORES = seedStores.filter((s) => s.status === "active");

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

// --- Reference data -------------------------------------------------------------

const SEED_CATEGORIES: { id: Id; name: string; parentId: Id | null }[] = [
  { id: "cat_drinkware", name: "Drinkware", parentId: null },
  { id: "cat_beans", name: "Whole Bean Coffee", parentId: null },
  { id: "cat_beverages", name: "Cold Beverages", parentId: null },
  { id: "cat_bakery", name: "Bakery & Pastry", parentId: null },
  { id: "cat_tea", name: "Tea & Matcha", parentId: null },
  { id: "cat_merch", name: "Merchandise", parentId: null },
  { id: "cat_espresso", name: "Espresso Bar", parentId: null },
];

const SEED_BRANDS: { id: Id; name: string }[] = [
  { id: "br_goods", name: "Mozud Goods" },
  { id: "br_roastery", name: "Mozud Roastery" },
  { id: "br_coldlab", name: "Mozud Cold Lab" },
  { id: "br_bakehouse", name: "BakeHouse Collective" },
  { id: "br_teahouse", name: "Verdant Tea House" },
];

const SEED_TAX_RATES: TaxRateConfig[] = [
  { id: "tax_standard", name: "Standard Retail (8.25%)", rate: 0.0825, isCompound: false, status: "active" },
  { id: "tax_exempt", name: "Prepared Food & Beverage (0%)", rate: 0, isCompound: false, status: "active" },
  { id: "tax_reduced", name: "Reduced Merchandise (4.125%)", rate: 0.04125, isCompound: false, status: "active" },
];

// --- Product seed ---------------------------------------------------------------

interface VariantSpec {
  sku: string;
  barcode?: string;
  variantName: string;
  costMajor: number;
  sellMajor: number;
  unit?: string;
  attributes?: Record<string, string>;
  reorderThreshold?: number;
  reorderQuantity?: number;
  status?: ProductStatus;
  stock: number[]; // index-aligned with STOCK_STORES
  bins?: string[];
}

interface ProductSpec {
  id: Id;
  name: string;
  description?: string;
  categoryId: Id;
  brandId?: Id;
  taxRateId?: Id;
  status?: ProductStatus;
  createdDaysAgo: number;
  variants: VariantSpec[];
}

function major(v: number) {
  return { amountMinor: Math.round(v * 100), currency: CURRENCY };
}

function buildVariant(productId: Id, spec: VariantSpec): ProductVariant {
  const stockByStore: VariantStoreStock[] = STOCK_STORES.map((store, i) => {
    const quantity = spec.stock[i] ?? 0;
    // Deterministic demo reservations so available ≠ on-hand on busier shelves.
    const reserved = quantity > 30 ? 2 : quantity > 10 ? 1 : 0;
    return {
      storeId: store.id,
      storeName: store.name,
      quantity,
      reserved,
      binLocation: spec.bins?.[i],
    };
  });
  return {
    id: uid("var"),
    productId,
    sku: spec.sku,
    barcode: spec.barcode,
    variantName: spec.variantName,
    costPrice: major(spec.costMajor),
    sellPrice: major(spec.sellMajor),
    unit: spec.unit ?? "each",
    attributes: spec.attributes ?? {},
    reorderThreshold: spec.reorderThreshold ?? 10,
    reorderQuantity: spec.reorderQuantity ?? 24,
    status: spec.status ?? "active",
    stockByStore,
  };
}

function buildProduct(spec: ProductSpec): Product {
  const createdAt = new Date(Date.now() - spec.createdDaysAgo * 86_400_000).toISOString();
  const category = SEED_CATEGORIES.find((c) => c.id === spec.categoryId);
  const brand = SEED_BRANDS.find((b) => b.id === spec.brandId);
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    categoryId: spec.categoryId,
    categoryName: category?.name ?? "Uncategorized",
    brandId: spec.brandId,
    brandName: brand?.name,
    taxRateId: spec.taxRateId ?? "tax_standard",
    isVariable: spec.variants.length > 1,
    status: spec.status ?? "active",
    variants: spec.variants.map((v) => buildVariant(spec.id, v)),
    createdAt,
    updatedAt: createdAt,
  };
}

const SEED_SPECS: ProductSpec[] = [
  {
    id: "prod_tumbler",
    name: "Mozud Heritage Ceramic Travel Tumbler",
    description: "Double-walled ceramic travel tumbler with a leak-proof lid.",
    categoryId: "cat_drinkware",
    brandId: "br_goods",
    taxRateId: "tax_reduced",
    createdDaysAgo: 40,
    variants: [
      { sku: "MC-100-12BLK", barcode: "890124801", variantName: "12oz / Matte Charcoal", costMajor: 9.2, sellMajor: 24.0, attributes: { Size: "12oz", Color: "Matte Charcoal" }, stock: [48, 35, 22], bins: ["A-14-R", "B-02-L", "C-07-R"] },
      { sku: "MC-100-12WHT", barcode: "890124802", variantName: "12oz / Frost White", costMajor: 9.2, sellMajor: 24.0, attributes: { Size: "12oz", Color: "Frost White" }, stock: [31, 18, 9], bins: ["A-14-R", "B-02-L", "C-07-R"] },
      { sku: "MC-100-16BLK", barcode: "890124803", variantName: "16oz / Matte Charcoal", costMajor: 11.0, sellMajor: 28.0, attributes: { Size: "16oz", Color: "Matte Charcoal" }, stock: [22, 14, 6], bins: ["A-15-R", "B-03-L", "C-08-R"] },
    ],
  },
  {
    id: "prod_colombia",
    name: "Single Origin Colombia Huila Beans",
    description: "Washed Colombia Huila, 250g whole bean.",
    categoryId: "cat_beans",
    brandId: "br_roastery",
    createdDaysAgo: 28,
    variants: [
      { sku: "CO-401", barcode: "890124810", variantName: "Default", costMajor: 12.0, sellMajor: 22.5, unit: "bag", attributes: {}, reorderThreshold: 20, reorderQuantity: 60, stock: [51, 34, 0], bins: ["D-01-A", "D-01-B"] },
    ],
  },
  {
    id: "prod_ethiopia",
    name: "Ethiopia Guji Washed Beans",
    description: "Floral, tea-like Ethiopia Guji, 250g whole bean.",
    categoryId: "cat_beans",
    brandId: "br_roastery",
    createdDaysAgo: 22,
    variants: [
      { sku: "BN-019", barcode: "8901240501", variantName: "Default", costMajor: 10.5, sellMajor: 18.0, unit: "bag", reorderThreshold: 15, reorderQuantity: 48, stock: [8, 4, 2] },
    ],
  },
  {
    id: "prod_coldbrew",
    name: "Classic Cold Brew Bottle 330ml",
    categoryId: "cat_beverages",
    brandId: "br_coldlab",
    taxRateId: "tax_exempt",
    createdDaysAgo: 14,
    variants: [
      { sku: "CB-330", barcode: "890124815", variantName: "Default", costMajor: 1.8, sellMajor: 4.95, reorderThreshold: 24, reorderQuantity: 96, stock: [56, 39, 17] },
    ],
  },
  {
    id: "prod_nitro",
    name: "Cold Brew Nitro 16oz",
    categoryId: "cat_beverages",
    brandId: "br_coldlab",
    taxRateId: "tax_exempt",
    createdDaysAgo: 10,
    variants: [
      { sku: "CB-010", barcode: "8901240301", variantName: "Default", costMajor: 2.1, sellMajor: 5.5, stock: [20, 14, 8] },
    ],
  },
  {
    id: "prod_croissant",
    name: "Artisan Sourdough Croissant",
    categoryId: "cat_bakery",
    brandId: "br_bakehouse",
    taxRateId: "tax_exempt",
    createdDaysAgo: 6,
    variants: [
      { sku: "AS-008", barcode: "890124822", variantName: "Default", costMajor: 1.4, sellMajor: 4.25, reorderThreshold: 12, reorderQuantity: 36, stock: [12, 6, 0] },
    ],
  },
  {
    id: "prod_cookie",
    name: "Brown Butter Cookie",
    categoryId: "cat_bakery",
    brandId: "br_bakehouse",
    taxRateId: "tax_exempt",
    createdDaysAgo: 6,
    variants: [
      { sku: "BK-009", barcode: "8901240403", variantName: "Default", costMajor: 0.9, sellMajor: 3.25, reorderThreshold: 20, reorderQuantity: 60, stock: [40, 12, 8] },
    ],
  },
  {
    id: "prod_matcha",
    name: "Ceremonial Grade Matcha 100g",
    categoryId: "cat_tea",
    brandId: "br_teahouse",
    createdDaysAgo: 33,
    variants: [
      { sku: "TM-003", barcode: "8901240201", variantName: "Default", costMajor: 14.0, sellMajor: 32.0, unit: "tin", reorderThreshold: 8, reorderQuantity: 24, stock: [18, 9, 4] },
    ],
  },
  {
    id: "prod_chai",
    name: "Masala Chai Concentrate 1L",
    categoryId: "cat_tea",
    brandId: "br_teahouse",
    createdDaysAgo: 19,
    variants: [
      { sku: "TM-005", barcode: "8901240202", variantName: "Default", costMajor: 4.2, sellMajor: 11.0, unit: "bottle", stock: [22, 15, 7] },
    ],
  },
  {
    id: "prod_tote",
    name: "Mozud Canvas Tote",
    categoryId: "cat_merch",
    brandId: "br_goods",
    taxRateId: "tax_reduced",
    createdDaysAgo: 50,
    variants: [
      { sku: "MC-007-NAT", barcode: "8901240503", variantName: "Natural", costMajor: 6.0, sellMajor: 16.0, attributes: { Color: "Natural" }, stock: [20, 10, 7] },
      { sku: "MC-007-BLK", barcode: "8901240504", variantName: "Black", costMajor: 6.0, sellMajor: 16.0, attributes: { Color: "Black" }, stock: [12, 8, 5] },
    ],
  },
  {
    id: "prod_espresso_blend",
    name: "House Espresso Blend 1kg",
    categoryId: "cat_espresso",
    brandId: "br_roastery",
    createdDaysAgo: 60,
    variants: [
      { sku: "ES-001", barcode: "890124830", variantName: "Default", costMajor: 22.0, sellMajor: 39.0, unit: "bag", reorderThreshold: 10, reorderQuantity: 30, stock: [14, 9, 5] },
    ],
  },
  {
    id: "prod_mug",
    name: "Mozud Stoneware Mug 12oz",
    categoryId: "cat_drinkware",
    brandId: "br_goods",
    taxRateId: "tax_reduced",
    status: "inactive",
    createdDaysAgo: 70,
    variants: [
      { sku: "MG-212", variantName: "Default", costMajor: 4.5, sellMajor: 14.0, status: "inactive", stock: [0, 0, 0] },
    ],
  },
  {
    id: "prod_filter_mesh",
    name: "Cold Brew Filter Mesh 50pk",
    categoryId: "cat_merch",
    brandId: "br_coldlab",
    createdDaysAgo: 25,
    variants: [
      { sku: "CB-012", variantName: "Default", costMajor: 3.0, sellMajor: 9.5, unit: "pack", reorderThreshold: 15, reorderQuantity: 50, stock: [0, 2, 1] },
    ],
  },
  {
    id: "prod_lemonade",
    name: "Yuzu Lemonade 350ml",
    categoryId: "cat_beverages",
    brandId: "br_coldlab",
    taxRateId: "tax_exempt",
    createdDaysAgo: 9,
    variants: [
      { sku: "CB-014", barcode: "8901240302", variantName: "Default", costMajor: 1.5, sellMajor: 4.5, stock: [25, 11, 6] },
    ],
  },
];

// --- Derived helpers ------------------------------------------------------------

function totalStock(product: Product): number {
  return product.variants.reduce(
    (sum, v) => sum + v.stockByStore.reduce((s, row) => s + row.quantity, 0),
    0,
  );
}

function minSellMinor(product: Product): number {
  return Math.min(...product.variants.map((v) => v.sellPrice.amountMinor));
}

function matchesQuery(product: Product, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (product.name.toLowerCase().includes(needle)) return true;
  if ((product.brandName ?? "").toLowerCase().includes(needle)) return true;
  if (product.categoryName.toLowerCase().includes(needle)) return true;
  return product.variants.some(
    (v) =>
      v.sku.toLowerCase().includes(needle) ||
      (v.barcode ?? "").toLowerCase().includes(needle) ||
      v.variantName.toLowerCase().includes(needle),
  );
}

function compareProducts(a: Product, b: Product, sort: ProductListParams["sort"]): number {
  switch (sort) {
    case "name":
      return a.name.localeCompare(b.name);
    case "-name":
      return b.name.localeCompare(a.name);
    case "created":
      return a.createdAt.localeCompare(b.createdAt);
    case "sell":
      return minSellMinor(a) - minSellMinor(b);
    case "-sell":
      return minSellMinor(b) - minSellMinor(a);
    case "stock":
      return totalStock(a) - totalStock(b);
    case "-stock":
      return totalStock(b) - totalStock(a);
    case "-created":
    default:
      return b.createdAt.localeCompare(a.createdAt);
  }
}

// --- Mutable store --------------------------------------------------------------

function variantFromInput(productId: Id, existing: ProductVariant | undefined, input: VariantInput): ProductVariant {
  const stockByStore: VariantStoreStock[] =
    existing?.stockByStore ??
    STOCK_STORES.map((store) => ({ storeId: store.id, storeName: store.name, quantity: 0 }));
  return {
    id: existing?.id ?? uid("var"),
    productId,
    sku: input.sku.trim(),
    barcode: input.barcode?.trim() || undefined,
    variantName: input.variantName.trim() || "Default",
    costPrice: { amountMinor: Math.max(0, Math.round(input.costPriceMinor)), currency: CURRENCY },
    sellPrice: { amountMinor: Math.max(0, Math.round(input.sellPriceMinor)), currency: CURRENCY },
    unit: input.unit.trim() || "each",
    attributes: { ...input.attributes },
    reorderThreshold: Math.max(0, Math.round(input.reorderThreshold)),
    reorderQuantity: Math.max(0, Math.round(input.reorderQuantity)),
    status: input.status,
    stockByStore,
  };
}

interface CatalogState {
  products: Product[];
  categories: { id: Id; name: string; parentId: Id | null }[];
  brands: { id: Id; name: string }[];
  taxRates: TaxRateConfig[];
}

function freshState(): CatalogState {
  return {
    products: SEED_SPECS.map(buildProduct),
    categories: clone(SEED_CATEGORIES),
    brands: clone(SEED_BRANDS),
    taxRates: clone(SEED_TAX_RATES),
  };
}

const state: CatalogState = freshState();

function productCountForCategory(categoryId: Id): number {
  return state.products.filter((p) => p.categoryId === categoryId).length;
}

function productCountForBrand(brandId: Id): number {
  return state.products.filter((p) => p.brandId === brandId).length;
}

function needsAttention(product: Product): boolean {
  if (product.status === "inactive") return true;
  if (totalStock(product) <= 0) return true;
  return product.variants.some((v) => !v.barcode);
}

/** All SKUs currently in the catalog except those belonging to `exceptProductId`. */
function existingSkus(exceptProductId?: Id): Set<string> {
  const set = new Set<string>();
  for (const p of state.products) {
    if (p.id === exceptProductId) continue;
    for (const v of p.variants) set.add(v.sku.toLowerCase());
  }
  return set;
}

function assertUniqueSkus(input: ProductInput, exceptProductId?: Id): void {
  const existing = existingSkus(exceptProductId);
  const seen = new Set<string>();
  for (const v of input.variants) {
    const sku = v.sku.trim().toLowerCase();
    if (!sku) throw new ApiError("VALIDATION_FAILED", "Every variant needs a SKU.", { status: 422 });
    if (seen.has(sku)) {
      throw new ApiError("SKU_DUPLICATE", `Duplicate SKU in this product: ${v.sku}.`, { status: 409 });
    }
    if (existing.has(sku)) {
      throw new ApiError("SKU_DUPLICATE", `SKU already in use: ${v.sku}.`, { status: 409 });
    }
    seen.add(sku);
  }
}

// --- Public store operations (consumed by the mock adapter) ---------------------

export function catalogList(params: ProductListParams = {}): PageResult<Product> {
  const { q = "", categoryId, brandId, status = "all", sort = "-created", page = 1, pageSize = 25 } = params;
  const filtered = state.products.filter((p) => {
    if (!matchesQuery(p, q.trim())) return false;
    if (categoryId && p.categoryId !== categoryId) return false;
    if (brandId && p.brandId !== brandId) return false;
    if (status !== "all" && p.status !== status) return false;
    return true;
  });
  filtered.sort((a, b) => compareProducts(a, b, sort));
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize).map((p) => clone(p));
  return { data, total, page, pageSize };
}

export function catalogGetById(id: Id): Product | null {
  const product = state.products.find((p) => p.id === id);
  return product ? clone(product) : null;
}

export function catalogSummary(): CatalogSummary {
  const products = state.products;
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    variantProducts: products.filter((p) => p.isVariable).length,
    totalVariants,
    attentionCount: products.filter(needsAttention).length,
    categoryCount: state.categories.length,
  };
}

export function catalogCreate(input: ProductInput): Product {
  if (!input.name.trim()) throw new ApiError("VALIDATION_FAILED", "Product name is required.", { status: 422 });
  if (input.variants.length === 0) {
    throw new ApiError("VALIDATION_FAILED", "A product needs at least one variant.", { status: 422 });
  }
  assertUniqueSkus(input);
  const id = uid("prod");
  const category = state.categories.find((c) => c.id === input.categoryId);
  const brand = state.brands.find((b) => b.id === input.brandId);
  const createdAt = nowIso();
  const product: Product = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    categoryId: input.categoryId,
    categoryName: category?.name ?? "Uncategorized",
    brandId: input.brandId,
    brandName: brand?.name,
    taxRateId: input.taxRateId ?? "tax_standard",
    isVariable: input.variants.length > 1,
    status: input.status,
    variants: input.variants.map((v) => variantFromInput(id, undefined, v)),
    createdAt,
    updatedAt: createdAt,
  };
  state.products.unshift(product);
  return clone(product);
}

export function catalogUpdate(id: Id, input: ProductInput): Product {
  const index = state.products.findIndex((p) => p.id === id);
  if (index < 0) throw new ApiError("NOT_FOUND", "Product not found.", { status: 404 });
  if (input.variants.length === 0) {
    throw new ApiError("VALIDATION_FAILED", "A product needs at least one variant.", { status: 422 });
  }
  assertUniqueSkus(input, id);
  const prev = state.products[index]!;
  const category = state.categories.find((c) => c.id === input.categoryId);
  const brand = state.brands.find((b) => b.id === input.brandId);
  const existingVariants = new Map(prev.variants.map((v) => [v.id, v]));
  const updated: Product = {
    ...prev,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    categoryId: input.categoryId,
    categoryName: category?.name ?? "Uncategorized",
    brandId: input.brandId,
    brandName: brand?.name,
    taxRateId: input.taxRateId ?? "tax_standard",
    isVariable: input.variants.length > 1,
    status: input.status,
    variants: input.variants.map((v) => variantFromInput(id, v.id ? existingVariants.get(v.id) : undefined, v)),
    updatedAt: nowIso(),
  };
  state.products[index] = updated;
  return clone(updated);
}

export function catalogSetStatus(id: Id, status: ProductStatus): Product {
  const product = state.products.find((p) => p.id === id);
  if (!product) throw new ApiError("NOT_FOUND", "Product not found.", { status: 404 });
  product.status = status;
  product.updatedAt = nowIso();
  return clone(product);
}

export function catalogBulkUpdatePrice(ids: Id[], adjustment: BulkPriceAdjustment): number {
  const set = new Set(ids);
  let count = 0;
  for (const product of state.products) {
    if (!set.has(product.id)) continue;
    for (const variant of product.variants) {
      const target = adjustment.target === "sell" ? variant.sellPrice : variant.costPrice;
      target.amountMinor = applyPriceAdjustment(target.amountMinor, adjustment);
    }
    product.updatedAt = nowIso();
    count += 1;
  }
  return count;
}

export function catalogBulkChangeCategory(ids: Id[], categoryId: Id): number {
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) throw new ApiError("VALIDATION_FAILED", "Unknown category.", { status: 422 });
  const set = new Set(ids);
  let count = 0;
  for (const product of state.products) {
    if (!set.has(product.id)) continue;
    product.categoryId = category.id;
    product.categoryName = category.name;
    product.updatedAt = nowIso();
    count += 1;
  }
  return count;
}

export function catalogBulkDeactivate(ids: Id[]): number {
  const set = new Set(ids);
  let count = 0;
  for (const product of state.products) {
    if (!set.has(product.id)) continue;
    product.status = "inactive";
    product.updatedAt = nowIso();
    count += 1;
  }
  return count;
}

// --- Categories / brands / tax rates --------------------------------------------

export function listCategories(): Category[] {
  return state.categories.map((c) => ({ ...c, productCount: productCountForCategory(c.id) }));
}

export function createCategory(input: { name: string; parentId: Id | null }): Category {
  const name = input.name.trim();
  if (!name) throw new ApiError("VALIDATION_FAILED", "Category name is required.", { status: 422 });
  const category = { id: uid("cat"), name, parentId: input.parentId };
  state.categories.push(category);
  return { ...category, productCount: 0 };
}

export function updateCategory(id: Id, input: { name: string; parentId: Id | null }): Category {
  const category = state.categories.find((c) => c.id === id);
  if (!category) throw new ApiError("NOT_FOUND", "Category not found.", { status: 404 });
  category.name = input.name.trim() || category.name;
  category.parentId = input.parentId;
  for (const product of state.products) {
    if (product.categoryId === id) product.categoryName = category.name;
  }
  return { ...category, productCount: productCountForCategory(id) };
}

export function removeCategory(id: Id): void {
  if (productCountForCategory(id) > 0) {
    throw new ApiError("CONFLICT", "Reassign products before deleting this category.", { status: 409 });
  }
  state.categories = state.categories.filter((c) => c.id !== id);
}

export function listBrands(): Brand[] {
  return state.brands.map((b) => ({ ...b, productCount: productCountForBrand(b.id) }));
}

export function createBrand(input: { name: string }): Brand {
  const name = input.name.trim();
  if (!name) throw new ApiError("VALIDATION_FAILED", "Brand name is required.", { status: 422 });
  const brand = { id: uid("br"), name };
  state.brands.push(brand);
  return { ...brand, productCount: 0 };
}

export function updateBrand(id: Id, input: { name: string }): Brand {
  const brand = state.brands.find((b) => b.id === id);
  if (!brand) throw new ApiError("NOT_FOUND", "Brand not found.", { status: 404 });
  brand.name = input.name.trim() || brand.name;
  for (const product of state.products) {
    if (product.brandId === id) product.brandName = brand.name;
  }
  return { ...brand, productCount: productCountForBrand(id) };
}

export function removeBrand(id: Id): void {
  if (productCountForBrand(id) > 0) {
    throw new ApiError("CONFLICT", "Reassign products before deleting this brand.", { status: 409 });
  }
  state.brands = state.brands.filter((b) => b.id !== id);
}

export function listTaxRates(): TaxRateConfig[] {
  return state.taxRates.map((t) => ({ ...t }));
}

/** Test-only: reset the mutable store between test cases. */
export function __resetCatalog(): void {
  Object.assign(state, freshState());
}

// --- Stock accessors (shared with the inventory module) -------------------------

/** Live reference to a variant and its store stock row, or null. */
function locate(variantId: Id, storeId: Id) {
  for (const product of state.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) continue;
    const row = variant.stockByStore.find((s) => s.storeId === storeId);
    if (!row) return null;
    return { product, variant, row };
  }
  return null;
}

export interface VariantStockSnapshot {
  onHand: number;
  reserved: number;
  binLocation?: string;
}

export function findVariantStock(variantId: Id, storeId: Id): VariantStockSnapshot | null {
  const found = locate(variantId, storeId);
  if (!found) return null;
  return {
    onHand: found.row.quantity,
    reserved: found.row.reserved ?? 0,
    binLocation: found.row.binLocation,
  };
}

/** Set a variant's on-hand at a store (clamped ≥ 0). Returns the new balance. */
export function setVariantOnHand(variantId: Id, storeId: Id, onHand: number): number {
  const found = locate(variantId, storeId);
  if (!found) throw new ApiError("NOT_FOUND", "Stock record not found.", { status: 404 });
  found.row.quantity = Math.max(0, Math.round(onHand));
  found.product.updatedAt = nowIso();
  return found.row.quantity;
}

/** All products (cloned) for inventory to flatten into stock rows. */
export function catalogAllProducts(): Product[] {
  return state.products.map((p) => clone(p));
}
