import { apiFetch, apiGetWithMeta } from "@/lib/api";
import type {
  Category,
  MovementType,
  PageMeta,
  Product,
  ProductListParams,
  ProductPage,
  StockMovement,
} from "./types";

/** Inventory HTTP calls, routed through the typed API client (docs/api.md §Phase 04). */

// --- Categories ---

export function listCategories(includeArchived = false): Promise<Category[]> {
  const qs = includeArchived ? "?includeArchived=true" : "";
  return apiFetch<{ categories: Category[] }>(`/categories${qs}`).then((d) => d.categories);
}

export function createCategory(input: { name: string }): Promise<Category> {
  return apiFetch<{ category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.category);
}

export function updateCategory(id: string, input: { name: string }): Promise<Category> {
  return apiFetch<{ category: Category }>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((d) => d.category);
}

export function archiveCategory(id: string): Promise<Category> {
  return apiFetch<{ category: Category }>(`/categories/${id}/archive`, { method: "POST" }).then(
    (d) => d.category,
  );
}

export function restoreCategory(id: string): Promise<Category> {
  return apiFetch<{ category: Category }>(`/categories/${id}/restore`, { method: "POST" }).then(
    (d) => d.category,
  );
}

// --- Products ---

export interface ProductInput {
  name: string;
  sku?: string | null;
  unit?: string;
  categoryId?: string | null;
  lowStockThreshold?: string;
  description?: string | null;
}

export function listProducts(params: ProductListParams): Promise<ProductPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.includeArchived) qs.set("includeArchived", "true");
  if (params.q) qs.set("q", params.q);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.stockStatus) qs.set("stockStatus", params.stockStatus);
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  const query = qs.toString();
  return apiGetWithMeta<{ products: Product[] }>(`/products${query ? `?${query}` : ""}`).then(
    (res) => ({ products: res.data.products, meta: res.meta as unknown as PageMeta }),
  );
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<{ product: Product }>(`/products/${id}`).then((d) => d.product);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiFetch<{ product: Product }>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.product);
}

export function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return apiFetch<{ product: Product }>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((d) => d.product);
}

export function archiveProduct(id: string): Promise<Product> {
  return apiFetch<{ product: Product }>(`/products/${id}/archive`, { method: "POST" }).then(
    (d) => d.product,
  );
}

export function restoreProduct(id: string): Promise<Product> {
  return apiFetch<{ product: Product }>(`/products/${id}/restore`, { method: "POST" }).then(
    (d) => d.product,
  );
}

// --- Stock movements (docs/api.md §Phase 05) ---

export interface MovementInput {
  type: MovementType;
  // A magnitude for IN/OUT/DAMAGED_LOST; a signed correction for ADJUSTMENT.
  quantity: string;
  reason?: string | null;
}

export function recordMovement(productId: string, input: MovementInput): Promise<StockMovement> {
  return apiFetch<{ movement: StockMovement }>(`/products/${productId}/movements`, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.movement);
}

export function listMovements(productId: string): Promise<StockMovement[]> {
  return apiFetch<{ movements: StockMovement[] }>(`/products/${productId}/movements`).then(
    (d) => d.movements,
  );
}
