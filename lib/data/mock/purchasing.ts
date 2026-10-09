import type {
  CreatePurchaseOrderInput,
  Id,
  PurchaseKpis,
  PurchaseListParams,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  ReceivePurchaseInput,
  Supplier,
  SupplierInput,
  SupplierListItem,
} from "../types";
import { ApiError } from "../errors";
import {
  lineTotalMinor,
  paymentStatus,
  statusAfterReceive,
  supplierOutstandingMinor,
} from "@/features/purchases/purchasing-math";
import { catalogAllProducts } from "./catalog";
import { recordPurchaseReceipt } from "./inventory";
import { seedStores, seedUser } from "./seed";

/**
 * In-memory purchasing store for Stage 1: suppliers + purchase orders. Receiving flows
 * through the shared inventory ledger (purchase_receipt movements). Supplier balances
 * are derived from committed POs. Removed in Stage 3. Not production data.
 */

const CURRENCY = "USD";

/** Subtotal / tax / total for a set of PO lines (minor units + tax fraction). */
function orderTotals(
  lines: { unitCostMinor: number; quantity: number }[],
  taxRate = 0,
): { subtotalMinor: number; taxMinor: number; totalMinor: number } {
  const subtotalMinor = lines.reduce((sum, l) => sum + lineTotalMinor(l.unitCostMinor, l.quantity), 0);
  const taxMinor = Math.max(0, Math.round(subtotalMinor * taxRate));
  return { subtotalMinor, taxMinor, totalMinor: subtotalMinor + taxMinor };
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function money(minor: number) {
  return { amountMinor: Math.round(minor), currency: CURRENCY };
}

function storeName(storeId: Id): string {
  return seedStores.find((s) => s.id === storeId)?.name ?? "Store";
}

function findVariantBySku(sku: string): { product: Product; variant: Product["variants"][number] } | null {
  for (const product of catalogAllProducts()) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return null;
}

function findVariantById(variantId: Id): { product: Product; variant: Product["variants"][number] } | null {
  for (const product of catalogAllProducts()) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

const SEED_SUPPLIERS: Supplier[] = [
  { id: "sup_origins", name: "Origins Coffee Importers", contactName: "Lucia Marković", email: "orders@originscoffee.example", phone: "+1 512-555-0101", address: "Austin, TX", currencyCode: CURRENCY, status: "active", createdAt: new Date(Date.now() - 220 * 86_400_000).toISOString() },
  { id: "sup_bakehouse", name: "BakeHouse Collective Supply", contactName: "Tom Alvarez", email: "wholesale@bakehouse.example", phone: "+1 512-555-0144", address: "Round Rock, TX", currencyCode: CURRENCY, status: "active", createdAt: new Date(Date.now() - 180 * 86_400_000).toISOString() },
  { id: "sup_coldlab", name: "Cold Lab Beverages", contactName: "Priya Nair", email: "supply@coldlab.example", phone: "+1 512-555-0199", address: "Austin, TX", currencyCode: CURRENCY, status: "active", createdAt: new Date(Date.now() - 120 * 86_400_000).toISOString() },
  { id: "sup_teahouse", name: "Verdant Tea House", contactName: "Kenji Watanabe", email: "b2b@verdant.example", phone: "+1 737-555-0170", address: "Dallas, TX", currencyCode: CURRENCY, status: "active", createdAt: new Date(Date.now() - 90 * 86_400_000).toISOString() },
  { id: "sup_goods", name: "Mozud Goods Mfg", contactName: "Dana Lee", email: "ops@mozudgoods.example", phone: "+1 512-555-0133", address: "Houston, TX", currencyCode: CURRENCY, status: "inactive", createdAt: new Date(Date.now() - 300 * 86_400_000).toISOString() },
];

// --- Purchase-order seed --------------------------------------------------------

interface PoItemSpec {
  sku: string;
  ordered: number;
  received: number;
  unitCostMajor: number;
}

interface PoSpec {
  poNumber: string;
  supplierId: Id;
  storeId: Id;
  status: PurchaseOrder["status"];
  taxRate?: number;
  expectedInDays?: number;
  orderedDaysAgo?: number;
  receivedDaysAgo?: number;
  amountPaidMajor?: number;
  items: PoItemSpec[];
}

function buildPoItem(spec: PoItemSpec): PurchaseOrderItem | null {
  const ref = findVariantBySku(spec.sku);
  if (!ref) return null;
  const unitCostMinor = Math.round(spec.unitCostMajor * 100);
  return {
    variantId: ref.variant.id,
    sku: ref.variant.sku,
    productName: ref.product.name,
    variantName: ref.variant.variantName,
    quantityOrdered: spec.ordered,
    quantityReceived: spec.received,
    unitCost: money(unitCostMinor),
    lineTotal: money(lineTotalMinor(unitCostMinor, spec.ordered)),
  };
}

function buildPo(spec: PoSpec): PurchaseOrder {
  const items = spec.items.map(buildPoItem).filter((i): i is PurchaseOrderItem => i !== null);
  const totals = orderTotals(
    items.map((i) => ({ unitCostMinor: i.unitCost.amountMinor, quantity: i.quantityOrdered })),
    spec.taxRate ?? 0,
  );
  const paidMinor = Math.round((spec.amountPaidMajor ?? 0) * 100);
  const supplier = SEED_SUPPLIERS.find((s) => s.id === spec.supplierId);
  const createdAt = new Date(Date.now() - (spec.orderedDaysAgo ?? 2) * 86_400_000).toISOString();
  return {
    id: uid("po"),
    poNumber: spec.poNumber,
    supplierId: spec.supplierId,
    supplierName: supplier?.name ?? "Supplier",
    storeId: spec.storeId,
    storeName: storeName(spec.storeId),
    status: spec.status,
    paymentStatus: paymentStatus(totals.totalMinor, paidMinor),
    expectedAt:
      spec.expectedInDays !== undefined
        ? new Date(Date.now() + spec.expectedInDays * 86_400_000).toISOString()
        : undefined,
    orderedAt: spec.status === "draft" ? undefined : createdAt,
    receivedAt:
      spec.receivedDaysAgo !== undefined
        ? new Date(Date.now() - spec.receivedDaysAgo * 86_400_000).toISOString()
        : undefined,
    subtotal: money(totals.subtotalMinor),
    taxTotal: money(totals.taxMinor),
    total: money(totals.totalMinor),
    amountPaid: money(paidMinor),
    currency: CURRENCY,
    createdBy: seedUser.fullName,
    createdAt,
    items,
  };
}

let poSeq = 4120;

function seedPurchaseOrders(): PurchaseOrder[] {
  const downtown = seedStores[0]!.id;
  const specs: PoSpec[] = [
    {
      poNumber: `PO-${(poSeq += 1)}`,
      supplierId: "sup_origins",
      storeId: downtown,
      status: "ordered",
      expectedInDays: 3,
      orderedDaysAgo: 2,
      taxRate: 0,
      items: [
        { sku: "CO-401", ordered: 40, received: 0, unitCostMajor: 12.0 },
        { sku: "BN-019", ordered: 30, received: 0, unitCostMajor: 10.5 },
      ],
    },
    {
      poNumber: `PO-${(poSeq += 1)}`,
      supplierId: "sup_coldlab",
      storeId: downtown,
      status: "partially_received",
      expectedInDays: 1,
      orderedDaysAgo: 5,
      amountPaidMajor: 50,
      items: [
        { sku: "CB-330", ordered: 96, received: 48, unitCostMajor: 1.8 },
        { sku: "CB-012", ordered: 50, received: 0, unitCostMajor: 3.0 },
      ],
    },
    {
      poNumber: `PO-${(poSeq += 1)}`,
      supplierId: "sup_bakehouse",
      storeId: downtown,
      status: "received",
      orderedDaysAgo: 9,
      receivedDaysAgo: 7,
      amountPaidMajor: 54,
      items: [{ sku: "AS-008", ordered: 36, received: 36, unitCostMajor: 1.4 }],
    },
    {
      poNumber: `PO-${(poSeq += 1)}`,
      supplierId: "sup_teahouse",
      storeId: downtown,
      status: "draft",
      items: [{ sku: "TM-003", ordered: 24, received: 0, unitCostMajor: 14.0 }],
    },
  ];
  return specs.map(buildPo);
}

interface PurchasingState {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
}

function freshState(): PurchasingState {
  return { suppliers: clone(SEED_SUPPLIERS), orders: seedPurchaseOrders() };
}

const state: PurchasingState = freshState();

// --- Suppliers ------------------------------------------------------------------

function ordersForSupplier(supplierId: Id): PurchaseOrder[] {
  return state.orders.filter((o) => o.supplierId === supplierId);
}

export function listSuppliers(): SupplierListItem[] {
  return state.suppliers.map((supplier) => {
    const orders = ordersForSupplier(supplier.id);
    return {
      ...clone(supplier),
      orderCount: orders.length,
      outstanding: money(supplierOutstandingMinor(orders)),
    };
  });
}

export function getSupplier(id: Id): Supplier | null {
  const supplier = state.suppliers.find((s) => s.id === id);
  return supplier ? clone(supplier) : null;
}

export function supplierHistory(id: Id): PurchaseOrder[] {
  return ordersForSupplier(id)
    .map((o) => clone(o))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createSupplier(input: SupplierInput): Supplier {
  if (!input.name.trim()) throw new ApiError("VALIDATION_FAILED", "Supplier name is required.", { status: 422 });
  const supplier: Supplier = {
    id: uid("sup"),
    name: input.name.trim(),
    contactName: input.contactName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    currencyCode: input.currencyCode || CURRENCY,
    status: input.status,
    createdAt: nowIso(),
  };
  state.suppliers.push(supplier);
  return clone(supplier);
}

export function updateSupplier(id: Id, input: SupplierInput): Supplier {
  const supplier = state.suppliers.find((s) => s.id === id);
  if (!supplier) throw new ApiError("NOT_FOUND", "Supplier not found.", { status: 404 });
  Object.assign(supplier, {
    name: input.name.trim() || supplier.name,
    contactName: input.contactName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    currencyCode: input.currencyCode || supplier.currencyCode,
    status: input.status,
  });
  // Keep PO snapshots' supplierName in sync.
  for (const order of state.orders) if (order.supplierId === id) order.supplierName = supplier.name;
  return clone(supplier);
}

export function setSupplierStatus(id: Id, status: Supplier["status"]): Supplier {
  const supplier = state.suppliers.find((s) => s.id === id);
  if (!supplier) throw new ApiError("NOT_FOUND", "Supplier not found.", { status: 404 });
  supplier.status = status;
  return clone(supplier);
}

// --- Purchase orders ------------------------------------------------------------

export function listPurchaseOrders(params: PurchaseListParams = {}): PurchaseOrder[] {
  const q = (params.q ?? "").trim().toLowerCase();
  return state.orders
    .filter((o) => {
      if (params.status && params.status !== "all" && o.status !== params.status) return false;
      if (params.supplierId && o.supplierId !== params.supplierId) return false;
      if (params.storeId && o.storeId !== params.storeId) return false;
      if (!q) return true;
      return o.poNumber.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q);
    })
    .map((o) => clone(o))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPurchaseOrder(id: Id): PurchaseOrder | null {
  const order = state.orders.find((o) => o.id === id);
  return order ? clone(order) : null;
}

export function purchaseKpis(): PurchaseKpis {
  const open = state.orders.filter(
    (o) => o.status === "draft" || o.status === "ordered" || o.status === "partially_received",
  );
  const awaiting = state.orders.filter((o) => o.status === "ordered" || o.status === "partially_received");
  const outstanding = supplierOutstandingMinor(state.orders);
  const cutoff = Date.now() - 30 * 86_400_000;
  const spend = state.orders
    .filter((o) => o.status !== "cancelled" && o.status !== "draft" && Date.parse(o.createdAt) >= cutoff)
    .reduce((sum, o) => sum + o.total.amountMinor, 0);
  return {
    openOrders: open.length,
    awaitingReceipt: awaiting.length,
    outstandingPayables: money(outstanding),
    spendThisPeriod: money(spend),
  };
}

function requireOrder(id: Id): PurchaseOrder {
  const order = state.orders.find((o) => o.id === id);
  if (!order) throw new ApiError("NOT_FOUND", "Purchase order not found.", { status: 404 });
  return order;
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput): PurchaseOrder {
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!supplier) throw new ApiError("VALIDATION_FAILED", "Select a supplier.", { status: 422 });
  const lines = input.items.filter((i) => i.quantityOrdered > 0);
  if (lines.length === 0) throw new ApiError("VALIDATION_FAILED", "Add at least one item.", { status: 422 });

  const items: PurchaseOrderItem[] = lines.map((line) => {
    const ref = findVariantById(line.variantId);
    if (!ref) throw new ApiError("NOT_FOUND", "Variant not found.", { status: 404 });
    const unitCostMinor = Math.max(0, Math.round(line.unitCostMinor));
    return {
      variantId: ref.variant.id,
      sku: ref.variant.sku,
      productName: ref.product.name,
      variantName: ref.variant.variantName,
      quantityOrdered: Math.round(line.quantityOrdered),
      quantityReceived: 0,
      unitCost: money(unitCostMinor),
      lineTotal: money(lineTotalMinor(unitCostMinor, line.quantityOrdered)),
    };
  });
  const totals = orderTotals(
    items.map((i) => ({ unitCostMinor: i.unitCost.amountMinor, quantity: i.quantityOrdered })),
    input.taxRate ?? 0,
  );
  const order: PurchaseOrder = {
    id: uid("po"),
    poNumber: `PO-${(poSeq += 1)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    storeId: input.storeId,
    storeName: storeName(input.storeId),
    status: "draft",
    paymentStatus: "unpaid",
    expectedAt: input.expectedAt,
    subtotal: money(totals.subtotalMinor),
    taxTotal: money(totals.taxMinor),
    total: money(totals.totalMinor),
    amountPaid: money(0),
    currency: CURRENCY,
    createdBy: seedUser.fullName,
    createdAt: nowIso(),
    items,
  };
  state.orders.unshift(order);
  return clone(order);
}

export function submitPurchaseOrder(id: Id): PurchaseOrder {
  const order = requireOrder(id);
  if (order.status !== "draft") throw new ApiError("CONFLICT", "Only drafts can be ordered.", { status: 409 });
  order.status = "ordered";
  order.orderedAt = nowIso();
  return clone(order);
}

export function receivePurchase(input: ReceivePurchaseInput): PurchaseOrder {
  const order = requireOrder(input.id);
  if (order.status !== "ordered" && order.status !== "partially_received") {
    throw new ApiError("CONFLICT", "This order is not awaiting receipt.", { status: 409 });
  }
  const receiveMap = new Map(input.lines.map((l) => [l.variantId, Math.max(0, Math.round(l.quantityReceived))]));
  for (const item of order.items) {
    const requested = receiveMap.get(item.variantId) ?? 0;
    const remaining = item.quantityOrdered - item.quantityReceived;
    const add = Math.min(requested, remaining);
    if (add <= 0) continue;
    recordPurchaseReceipt({
      storeId: order.storeId,
      variantId: item.variantId,
      quantity: add,
      referenceId: order.poNumber,
    });
    item.quantityReceived += add;
  }
  order.status = statusAfterReceive(order.items);
  if (order.status === "received") order.receivedAt = nowIso();
  return clone(order);
}

export function recordPurchasePayment(id: Id, amountMinor: number): PurchaseOrder {
  const order = requireOrder(id);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new ApiError("VALIDATION_FAILED", "Payment amount must be greater than zero.", { status: 422 });
  }
  const paid = Math.min(order.total.amountMinor, order.amountPaid.amountMinor + Math.round(amountMinor));
  order.amountPaid = money(paid);
  order.paymentStatus = paymentStatus(order.total.amountMinor, paid);
  return clone(order);
}

export function cancelPurchaseOrder(id: Id): PurchaseOrder {
  const order = requireOrder(id);
  if (order.status === "received" || order.status === "cancelled") {
    throw new ApiError("CONFLICT", "This order can no longer be cancelled.", { status: 409 });
  }
  order.status = "cancelled";
  return clone(order);
}

/** Test-only: reset the purchasing store and reseed from the current catalog. */
export function __resetPurchasing(): void {
  Object.assign(state, freshState());
}
