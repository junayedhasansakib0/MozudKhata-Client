import type {
  CreateRefundInput,
  Id,
  Product,
  Refund,
  RefundItem,
  SaleOrder,
  SaleOrderItem,
  SalePayment,
  SalesKpis,
  SalesListParams,
  TenderMethod,
} from "../types";
import type { CreateSaleInput, SaleReceipt } from "../types";
import { ApiError } from "../errors";
import { refundableQty, refundStatus, unitRefundMinor } from "@/features/sales/sales-math";
import { catalogAllProducts } from "./catalog";
import { recordSaleReturn } from "./inventory";
import { adjustCustomerBalance, getCustomer } from "./customers";
import { seedStores, seedUser } from "./seed";

/**
 * In-memory sales/orders + refunds store for Stage 1. Seeded with historical orders;
 * also receives completed POS sales via recordPosOrder so a sale rings up in history.
 * Refund restock flows through the shared inventory ledger (sale_return movements).
 * Removed in Stage 3. Not production data.
 */

const CURRENCY = "USD";
const TAX_RATE = 0.0825;

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

let orderSeq = 9100;

// --- Order seed -----------------------------------------------------------------

interface OrderItemSpec {
  sku: string;
  qty: number;
  refunded?: number;
}

interface OrderSpec {
  storeId: Id;
  customerId?: Id;
  customerName?: string;
  daysAgo: number;
  status?: SaleOrder["status"];
  method?: TenderMethod | "other";
  items: OrderItemSpec[];
}

function buildOrderItem(spec: OrderItemSpec): SaleOrderItem | null {
  const ref = findVariantBySku(spec.sku);
  if (!ref) return null;
  const unit = ref.variant.sellPrice.amountMinor;
  const lineTotal = unit * spec.qty;
  return {
    id: uid("oi"),
    variantId: ref.variant.id,
    sku: ref.variant.sku,
    name: ref.product.name,
    quantity: spec.qty,
    unitPrice: money(unit),
    discount: money(0),
    taxAmount: money(Math.round(lineTotal * TAX_RATE)),
    lineTotal: money(lineTotal),
    costPriceAtSale: money(ref.variant.costPrice.amountMinor),
    quantityRefunded: spec.refunded ?? 0,
  };
}

function buildOrder(spec: OrderSpec): SaleOrder {
  const items = spec.items.map(buildOrderItem).filter((i): i is SaleOrderItem => i !== null);
  const subtotal = items.reduce((s, i) => s + i.lineTotal.amountMinor, 0);
  const taxTotal = items.reduce((s, i) => s + i.taxAmount.amountMinor, 0);
  const total = subtotal + taxTotal;
  const createdAt = new Date(Date.now() - spec.daysAgo * 86_400_000).toISOString();
  const status = spec.status ?? "completed";
  const refundedTotal = items.reduce((s, i) => s + i.quantityRefunded * unitRefundMinor(i), 0);
  const customer = spec.customerId ? getCustomer(spec.customerId) : null;
  return {
    id: uid("ord"),
    orderNumber: `#${(orderSeq += 1)}`,
    storeId: spec.storeId,
    storeName: storeName(spec.storeId),
    cashierName: seedUser.fullName,
    customerId: spec.customerId,
    customerName: customer?.name ?? spec.customerName,
    status,
    subtotal: money(subtotal),
    discountTotal: money(0),
    taxTotal: money(taxTotal),
    total: money(total),
    amountPaid: money(status === "voided" ? 0 : total),
    refundedTotal: money(refundedTotal),
    currency: CURRENCY,
    completedAt: status === "voided" ? undefined : createdAt,
    createdAt,
    items,
    payments:
      status === "voided"
        ? []
        : [
            {
              id: uid("pay"),
              method: spec.method ?? "card",
              amount: money(total),
              createdAt,
            },
          ],
  };
}

function seedOrders(): SaleOrder[] {
  const downtown = seedStores[0]!.id;
  const specs: OrderSpec[] = [
    { storeId: downtown, customerId: "c_marcus", daysAgo: 0, method: "house_credit", items: [{ sku: "MC-100-12BLK", qty: 2 }, { sku: "AS-008", qty: 1 }] },
    { storeId: downtown, customerId: "c_elena", daysAgo: 0, method: "card", items: [{ sku: "CB-330", qty: 3 }] },
    { storeId: downtown, daysAgo: 1, method: "cash", customerName: "Walk-in", items: [{ sku: "CO-401", qty: 1 }] },
    { storeId: downtown, customerId: "c_sarah", daysAgo: 1, method: "qr_wallet", items: [{ sku: "TM-003", qty: 1 }, { sku: "CB-014", qty: 2 }] },
    { storeId: downtown, customerId: "c_david", daysAgo: 2, method: "card", status: "partially_refunded", items: [{ sku: "MC-007-NAT", qty: 2, refunded: 1 }] },
    { storeId: downtown, daysAgo: 3, method: "cash", customerName: "Walk-in", status: "refunded", items: [{ sku: "BK-009", qty: 4, refunded: 4 }] },
    { storeId: downtown, customerId: "c_elena", daysAgo: 4, method: "card", items: [{ sku: "ES-001", qty: 1 }] },
    { storeId: downtown, daysAgo: 5, method: "card", status: "voided", customerName: "Walk-in", items: [{ sku: "CB-010", qty: 1 }] },
  ];
  return specs.map(buildOrder);
}

interface SalesState {
  orders: SaleOrder[];
  refunds: Refund[];
}

function freshState(): SalesState {
  return { orders: seedOrders(), refunds: [] };
}

const state: SalesState = freshState();

// --- Reads ----------------------------------------------------------------------

export function listOrders(params: SalesListParams = {}): SaleOrder[] {
  const q = (params.q ?? "").trim().toLowerCase();
  return state.orders
    .filter((o) => {
      if (params.status && params.status !== "all" && o.status !== params.status) return false;
      if (params.storeId && o.storeId !== params.storeId) return false;
      if (params.customerId && o.customerId !== params.customerId) return false;
      if (!q) return true;
      return o.orderNumber.toLowerCase().includes(q) || (o.customerName ?? "").toLowerCase().includes(q);
    })
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(id: Id): SaleOrder | null {
  const order = state.orders.find((o) => o.id === id);
  return order ? clone(order) : null;
}

export function ordersForCustomer(customerId: Id): SaleOrder[] {
  return state.orders
    .filter((o) => o.customerId === customerId)
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function salesKpis(storeId?: Id): SalesKpis {
  const cutoff = Date.now() - 30 * 86_400_000;
  const inScope = state.orders.filter(
    (o) => (!storeId || o.storeId === storeId) && Date.parse(o.createdAt) >= cutoff,
  );
  const completed = inScope.filter((o) => o.status !== "voided");
  const gross = completed.reduce((s, o) => s + o.total.amountMinor, 0);
  const refunds = completed.reduce((s, o) => s + o.refundedTotal.amountMinor, 0);
  const count = completed.length;
  return {
    grossSales: money(gross),
    orderCount: count,
    refundsTotal: money(refunds),
    avgOrderValue: money(count === 0 ? 0 : Math.round(gross / count)),
  };
}

// --- Writes ---------------------------------------------------------------------

export function createRefund(input: CreateRefundInput): Refund {
  if (!input.supervisorPin.trim()) {
    throw new ApiError("OVERRIDE_REQUIRED", "Supervisor authorization is required.", { status: 403 });
  }
  const order = state.orders.find((o) => o.id === input.orderId);
  if (!order) throw new ApiError("NOT_FOUND", "Order not found.", { status: 404 });
  if (order.status === "voided") {
    throw new ApiError("CONFLICT", "A voided order cannot be refunded.", { status: 409 });
  }

  const refundItems: RefundItem[] = [];
  let amountMinor = 0;
  for (const line of input.lines) {
    const item = order.items.find((i) => i.id === line.orderItemId);
    if (!item) continue;
    const qty = Math.min(Math.max(0, Math.round(line.quantity)), refundableQty(item));
    if (qty <= 0) continue;
    const lineAmount = qty * unitRefundMinor(item);
    amountMinor += lineAmount;
    item.quantityRefunded += qty;
    refundItems.push({ orderItemId: item.id, sku: item.sku, name: item.name, quantity: qty, amount: money(lineAmount) });
    if (input.restock) {
      recordSaleReturn({ storeId: order.storeId, variantId: item.variantId, quantity: qty, referenceId: order.orderNumber });
    }
  }

  if (refundItems.length === 0) {
    throw new ApiError("VALIDATION_FAILED", "Select at least one item to refund.", { status: 422 });
  }

  order.refundedTotal = money(order.refundedTotal.amountMinor + amountMinor);
  const nextStatus = refundStatus(order.items);
  if (nextStatus) order.status = nextStatus;

  // Refunds to house credit reduce the customer's receivable balance.
  if (input.method === "house_credit" && order.customerId) {
    adjustCustomerBalance(order.customerId, -amountMinor);
  }

  const refund: Refund = {
    id: uid("rf"),
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: money(amountMinor),
    method: input.method,
    reason: input.reason,
    restock: input.restock,
    createdBy: seedUser.fullName,
    createdAt: nowIso(),
    items: refundItems,
  };
  state.refunds.unshift(refund);
  return clone(refund);
}

/** Append a completed POS sale to history (called from the POS mock). Additive. */
export function recordPosOrder(input: CreateSaleInput, receipt: SaleReceipt): void {
  const items: SaleOrderItem[] = input.lines.map((line) => {
    const lineTotal = line.unitPriceMinor * line.quantity;
    return {
      id: uid("oi"),
      variantId: line.variantId,
      sku: line.variantId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: money(line.unitPriceMinor),
      discount: money(0),
      taxAmount: money(0),
      lineTotal: money(lineTotal),
      costPriceAtSale: money(0),
      quantityRefunded: 0,
    };
  });
  const payments: SalePayment[] = input.payments.map((p) => ({
    id: uid("pay"),
    method: p.method,
    amount: money(p.amountMinor),
    createdAt: receipt.completedAt,
  }));
  const order: SaleOrder = {
    id: uid("ord"),
    orderNumber: receipt.orderNumber,
    storeId: input.storeId,
    storeName: receipt.storeName,
    cashierName: receipt.cashierName,
    customerId: input.customerId,
    customerName: receipt.customerName,
    status: "completed",
    subtotal: money(receipt.subtotalMinor),
    discountTotal: money(receipt.discountTotalMinor),
    taxTotal: money(receipt.taxTotalMinor),
    total: money(receipt.totalMinor),
    amountPaid: money(receipt.totalMinor),
    refundedTotal: money(0),
    currency: input.currency,
    completedAt: receipt.completedAt,
    createdAt: receipt.completedAt,
    items,
    payments,
  };
  state.orders.unshift(order);
}

/** Test-only reset. */
export function __resetSales(): void {
  Object.assign(state, freshState());
}
