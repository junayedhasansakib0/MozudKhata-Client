/** Inventory types mirroring the server's public shapes (docs/api.md §Phase 04). */

export type StockStatus = "IN_STOCK" | "LOW" | "OUT";

export interface Category {
  id: string;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  categoryId: string | null;
  category: CategorySummary | null;
  // Decimals arrive as strings to preserve precision (docs/api.md §1).
  quantity: string;
  lowStockThreshold: string;
  stockStatus: StockStatus;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductPage {
  products: Product[];
  meta: PageMeta;
}

/** Product list query params (docs/api.md §Phase 06 — search/filter/sort). */
export type ProductSort = "name" | "createdAt" | "updatedAt" | "quantity";
export type SortOrder = "asc" | "desc";

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
  q?: string;
  categoryId?: string;
  stockStatus?: StockStatus;
  sort?: ProductSort;
  order?: SortOrder;
}

/** Stock ledger types mirroring the server's public shapes (docs/api.md §Phase 05). */

export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "DAMAGED_LOST";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  // Signed decimals arrive as strings to preserve precision (docs/api.md §1).
  quantityDelta: string;
  balanceAfter: string;
  reason: string | null;
  actorId: string;
  createdAt: string;
}
