/**
 * Core domain types shared across the frontend data-access layer.
 *
 * These mirror the backend contracts described in docs/architecture.md and
 * docs/database.md at the shape the UI consumes. During Stage 1 they are served by
 * the mock adapter; from Stage 3 the same types are returned by the HTTP adapter.
 * Per-module entity types (products, inventory, orders, …) are added in their phases.
 */

/** Monetary amount in integer minor units + ISO 4217 currency (never floats). */
export interface Money {
  amountMinor: number;
  currency: string;
}

export type Id = string;

/** Cursor-paginated collection envelope (mirrors docs/api.md). */
export interface Paginated<T> {
  data: T[];
  pagination: {
    limit: number;
    cursorNext: string | null;
    total: number;
  };
}

export type StoreStatus = "active" | "inactive";

export interface Store {
  id: Id;
  name: string;
  code: string;
  city: string;
  currency: string;
  status: StoreStatus;
}

/** Seeded RBAC roles (see docs/security.md). */
export type RoleKey = "owner" | "store_manager" | "cashier" | "inventory_supervisor";

export interface AuthUser {
  id: Id;
  fullName: string;
  email: string;
  role: RoleKey;
  avatarUrl?: string;
}

export interface Tenant {
  id: Id;
  name: string;
  baseCurrency: string;
  locale: string;
}

export interface UserSession {
  user: AuthUser;
  tenant: Tenant;
  stores: Store[];
  activeStoreId: Id;
}

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface AppNotification {
  id: Id;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string; // ISO 8601 UTC
}

// --- Dashboard (executive overview) ---

export interface Kpi {
  value: Money;
  deltaPct: number;
  spark: number[];
}

export interface DashboardKpis {
  netProfit: Kpi;
  grossSales: Kpi;
  avgOrderValue: Kpi;
  totalOrders: { value: number; deltaPct: number; spark: number[] };
}

export interface HourlyPoint {
  hour: string;
  sales: number; // minor units
}

export interface CategorySlice {
  category: string;
  amount: number; // minor units
}

export interface TopProduct {
  id: Id;
  name: string;
  unitsSold: number;
  revenue: Money;
}

export type StockUrgency = "low" | "out";

export interface LowStockItem {
  id: Id;
  name: string;
  sku: string;
  onHand: number;
  threshold: number;
  urgency: StockUrgency;
}

export type PaymentMethodKey = "cash" | "card" | "qr_wallet" | "house_credit";
export type TransactionStatus = "completed" | "refunded" | "voided";

export interface RecentTransaction {
  id: Id;
  orderNumber: string;
  customer: string;
  amount: Money;
  method: PaymentMethodKey;
  status: TransactionStatus;
  at: string; // ISO 8601 UTC
}

export interface CashDrawer {
  openingFloat: Money;
  currentCash: Money;
  expectedCash: Money;
  projectedClose: Money;
}

export interface DashboardData {
  kpis: DashboardKpis;
  hourly: HourlyPoint[];
  categories: CategorySlice[];
  topProducts: TopProduct[];
  lowStock: LowStockItem[];
  recentTransactions: RecentTransaction[];
  cashDrawer: CashDrawer;
}

// --- POS (High-Speed Terminal) ---

export interface PosProduct {
  id: Id;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: Id;
  categoryName: string;
  price: Money;
  stock: number;
  unit: string;
}

export interface PosCategory {
  id: Id;
  name: string;
  count: number;
}

export interface PosCustomer {
  id: Id;
  name: string;
  phone?: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  /** Order-level loyalty discount applied automatically when selected (e.g. 10). */
  loyaltyDiscountPct?: number;
}

export interface TaxLine {
  id: Id;
  name: string;
  rate: number; // fraction, e.g. 0.0825
}

export type TenderMethod = "cash" | "card" | "qr_wallet" | "house_credit";

export interface SalePaymentInput {
  method: TenderMethod;
  amountMinor: number;
}

export interface SaleLineInput {
  variantId: Id;
  name: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface CreateSaleInput {
  storeId: Id;
  customerId?: Id;
  lines: SaleLineInput[];
  discountTotalMinor: number;
  payments: SalePaymentInput[];
  idempotencyKey: string;
  currency: string;
}

// --- Catalog (Products, Variants, Categories, Brands, Tax) ---

export type ProductStatus = "active" | "inactive";

/** Product grouping; supports a one-level hierarchy via parentId (docs/database.md). */
export interface Category {
  id: Id;
  name: string;
  parentId: Id | null;
  /** Number of products in this category (derived, for list display). */
  productCount: number;
}

export interface Brand {
  id: Id;
  name: string;
  productCount: number;
}

/** Tenant tax-rate configuration (docs/database.md tax_rates). */
export interface TaxRateConfig {
  id: Id;
  name: string;
  rate: number; // fraction, e.g. 0.0825
  isCompound: boolean;
  status: ProductStatus;
}

/** On-hand stock for a variant at one store (read view for the catalog table). */
export interface VariantStoreStock {
  storeId: Id;
  storeName: string;
  quantity: number;
  binLocation?: string;
}

/** The sellable unit (child of a product). Every sellable thing is a variant. */
export interface ProductVariant {
  id: Id;
  productId: Id;
  sku: string;
  barcode?: string;
  /** e.g. "16oz / Matte Charcoal"; "Default" for single-item products. */
  variantName: string;
  costPrice: Money;
  sellPrice: Money;
  unit: string; // each, kg, bag, ...
  /** Variant matrix dimensions, e.g. { Size: "16oz", Color: "Matte Charcoal" }. */
  attributes: Record<string, string>;
  reorderThreshold: number;
  reorderQuantity: number;
  status: ProductStatus;
  /** Per-store on-hand (read view); total is the sum across stores. */
  stockByStore: VariantStoreStock[];
}

/** Master catalog item (parent). May have one default variant or many. */
export interface Product {
  id: Id;
  name: string;
  description?: string;
  categoryId: Id;
  categoryName: string;
  brandId?: Id;
  brandName?: string;
  taxRateId?: Id;
  /** True when the product has multiple variants (variant matrix). */
  isVariable: boolean;
  status: ProductStatus;
  imageUrl?: string;
  variants: ProductVariant[];
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export interface CatalogSummary {
  totalProducts: number;
  activeProducts: number;
  /** Products with more than one variant. */
  variantProducts: number;
  totalVariants: number;
  /** Products needing attention (missing barcode, out of stock, inactive). */
  attentionCount: number;
  categoryCount: number;
}

// --- Catalog write inputs & query params ---

export interface VariantInput {
  /** Present when editing an existing variant; absent for new variants. */
  id?: Id;
  sku: string;
  barcode?: string;
  variantName: string;
  costPriceMinor: number;
  sellPriceMinor: number;
  unit: string;
  attributes: Record<string, string>;
  reorderThreshold: number;
  reorderQuantity: number;
  status: ProductStatus;
}

export interface ProductInput {
  name: string;
  description?: string;
  categoryId: Id;
  brandId?: Id;
  taxRateId?: Id;
  imageUrl?: string;
  status: ProductStatus;
  variants: VariantInput[]; // at least one
}

export type ProductSortKey =
  | "name"
  | "-name"
  | "-created"
  | "created"
  | "sell"
  | "-sell"
  | "stock"
  | "-stock";

export interface ProductListParams {
  q?: string;
  categoryId?: Id | null;
  brandId?: Id | null;
  status?: ProductStatus | "all";
  sort?: ProductSortKey;
  page?: number; // 1-based (offset pagination for the admin catalog table)
  pageSize?: number; // 25 | 50 | 100
}

/** Offset-paginated page (admin catalog tables, per docs/api.md). */
export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type BulkPriceMode =
  | "set"
  | "increase_pct"
  | "decrease_pct"
  | "increase_amount"
  | "decrease_amount";

export interface BulkPriceAdjustment {
  target: "sell" | "cost";
  mode: BulkPriceMode;
  /** Percent (e.g. 10 = 10%) for *_pct modes; minor units for set/*_amount modes. */
  value: number;
}

export type ImportRowStatus = "create" | "update" | "error";

export interface ImportRow {
  line: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  cost: string;
  sell: string;
  unit: string;
  status: string;
}

export interface ImportRowResult {
  row: ImportRow;
  status: ImportRowStatus;
  issues: string[];
}

export interface ImportPreview {
  results: ImportRowResult[];
  createCount: number;
  updateCount: number;
  errorCount: number;
}

export interface ReceiptLine {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface SaleReceipt {
  orderNumber: string;
  completedAt: string;
  storeName: string;
  cashierName: string;
  customerName?: string;
  currency: string;
  lines: ReceiptLine[];
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
  payments: SalePaymentInput[];
  changeMinor: number;
}
