import type {
  AppNotification,
  AuthUser,
  Brand,
  BulkPriceAdjustment,
  CatalogSummary,
  Category,
  CreateAdjustmentInput,
  CreateSaleInput,
  CreateTransferInput,
  DashboardData,
  Id,
  InventoryItem,
  InventoryKpis,
  InventoryListParams,
  MovementListParams,
  PageResult,
  PosCategory,
  PosCustomer,
  PosProduct,
  Product,
  ProductInput,
  ProductListParams,
  PurchaseKpis,
  PurchaseListParams,
  PurchaseOrder,
  CreatePurchaseOrderInput,
  CreateRefundInput,
  Customer,
  CustomerInput,
  CustomerListItem,
  ReceivePurchaseInput,
  ReceiveTransferInput,
  Refund,
  SaleOrder,
  SalesKpis,
  SalesListParams,
  SaleReceipt,
  StockMovement,
  StockTransfer,
  Store,
  Supplier,
  SupplierInput,
  SupplierListItem,
  TaxLine,
  TaxRateConfig,
  UserSession,
} from "./types";

/**
 * Repository interfaces (contracts). The UI depends only on these — never on a
 * concrete implementation. Stage 1 binds them to the mock adapter; Stage 3 binds the
 * same contracts to an HTTP adapter with no UI changes. New per-module repositories
 * (products, inventory, orders, …) are added to DataSource in their phases.
 */

export interface SessionRepository {
  getCurrentSession(): Promise<UserSession>;
}

export interface StoresRepository {
  list(): Promise<Store[]>;
  getById(id: Id): Promise<Store | null>;
}

export interface NotificationsRepository {
  list(): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
}

export type DateRangeKey = "today" | "7d" | "30d" | "90d";

export interface DashboardRepository {
  getOverview(params: { storeId: Id; range: DateRangeKey }): Promise<DashboardData>;
}

export interface PosRepository {
  listProducts(params: { storeId: Id }): Promise<PosProduct[]>;
  listCategories(params: { storeId: Id }): Promise<PosCategory[]>;
  searchCustomers(query: string): Promise<PosCustomer[]>;
  getTaxLines(params: { storeId: Id }): Promise<TaxLine[]>;
  createSale(input: CreateSaleInput): Promise<SaleReceipt>;
}

/**
 * Catalog APIs (products + variants). Mirrors docs/api.md conventions (filter/sort/
 * paginate) and docs/business-rules.md (Products & Variants). Mutations update the
 * mock store in Stage 1; the HTTP adapter implements the same contract in Stage 3.
 */
export interface ProductsRepository {
  list(params?: ProductListParams): Promise<PageResult<Product>>;
  getById(id: Id): Promise<Product | null>;
  getSummary(): Promise<CatalogSummary>;
  create(input: ProductInput): Promise<Product>;
  update(id: Id, input: ProductInput): Promise<Product>;
  setStatus(id: Id, status: "active" | "inactive"): Promise<Product>;
  bulkUpdatePrice(ids: Id[], adjustment: BulkPriceAdjustment): Promise<number>;
  bulkChangeCategory(ids: Id[], categoryId: Id): Promise<number>;
  bulkDeactivate(ids: Id[]): Promise<number>;
}

export interface CategoryInput {
  name: string;
  parentId: Id | null;
}

export interface CategoriesRepository {
  list(): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  update(id: Id, input: CategoryInput): Promise<Category>;
  remove(id: Id): Promise<void>;
}

export interface BrandsRepository {
  list(): Promise<Brand[]>;
  create(input: { name: string }): Promise<Brand>;
  update(id: Id, input: { name: string }): Promise<Brand>;
  remove(id: Id): Promise<void>;
}

export interface TaxRatesRepository {
  list(): Promise<TaxRateConfig[]>;
}

/**
 * Inventory & stock control. Reads/mutates per-store stock levels, the immutable
 * stock-movement ledger, and inter-store transfers (docs/business-rules.md Inventory /
 * Stock Movements / Stock Transfers). Mock in Stage 1; HTTP adapter in Stage 3.
 */
export interface InventoryRepository {
  listItems(params: InventoryListParams): Promise<InventoryItem[]>;
  getKpis(params: { storeId: Id }): Promise<InventoryKpis>;
  listMovements(params: MovementListParams): Promise<StockMovement[]>;
  createAdjustment(input: CreateAdjustmentInput): Promise<StockMovement>;
  listTransfers(params?: { storeId?: Id }): Promise<StockTransfer[]>;
  createTransfer(input: CreateTransferInput): Promise<StockTransfer>;
  shipTransfer(id: Id): Promise<StockTransfer>;
  receiveTransfer(input: ReceiveTransferInput): Promise<StockTransfer>;
  cancelTransfer(id: Id): Promise<StockTransfer>;
}

/** Supplier directory + derived purchase history and outstanding balance. */
export interface SuppliersRepository {
  list(): Promise<SupplierListItem[]>;
  getById(id: Id): Promise<Supplier | null>;
  history(id: Id): Promise<PurchaseOrder[]>;
  create(input: SupplierInput): Promise<Supplier>;
  update(id: Id, input: SupplierInput): Promise<Supplier>;
  setStatus(id: Id, status: "active" | "inactive"): Promise<Supplier>;
}

/** Purchase orders: lifecycle (draft→ordered→received), receiving, payments. */
export interface PurchasesRepository {
  list(params?: PurchaseListParams): Promise<PurchaseOrder[]>;
  getById(id: Id): Promise<PurchaseOrder | null>;
  getKpis(): Promise<PurchaseKpis>;
  create(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
  submit(id: Id): Promise<PurchaseOrder>;
  receive(input: ReceivePurchaseInput): Promise<PurchaseOrder>;
  recordPayment(id: Id, amountMinor: number): Promise<PurchaseOrder>;
  cancel(id: Id): Promise<PurchaseOrder>;
}

/** Customer directory + loyalty + house-credit balance. */
export interface CustomersRepository {
  list(): Promise<CustomerListItem[]>;
  getById(id: Id): Promise<Customer | null>;
  create(input: CustomerInput): Promise<Customer>;
  update(id: Id, input: CustomerInput): Promise<Customer>;
  setStatus(id: Id, status: "active" | "inactive"): Promise<Customer>;
}

/** Sales/orders history, invoices, and refunds. */
export interface SalesRepository {
  list(params?: SalesListParams): Promise<SaleOrder[]>;
  getById(id: Id): Promise<SaleOrder | null>;
  getKpis(params?: { storeId?: Id }): Promise<SalesKpis>;
  listForCustomer(customerId: Id): Promise<SaleOrder[]>;
  createRefund(input: CreateRefundInput): Promise<Refund>;
}

export interface SignupInput {
  businessName: string;
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

/**
 * Authentication operations. Mirrors the backend auth endpoints in docs/api.md
 * (login / signup / password reset / email verification). Mock in Stage 1.
 */
export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResult>;
  signup(input: SignupInput): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
}

export interface DataSource {
  readonly auth: AuthRepository;
  readonly session: SessionRepository;
  readonly stores: StoresRepository;
  readonly notifications: NotificationsRepository;
  readonly dashboard: DashboardRepository;
  readonly pos: PosRepository;
  readonly products: ProductsRepository;
  readonly categories: CategoriesRepository;
  readonly brands: BrandsRepository;
  readonly taxRates: TaxRatesRepository;
  readonly inventory: InventoryRepository;
  readonly suppliers: SuppliersRepository;
  readonly purchases: PurchasesRepository;
  readonly customers: CustomersRepository;
  readonly sales: SalesRepository;
}
