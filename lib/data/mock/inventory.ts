import type {
  CreateAdjustmentInput,
  CreateTransferInput,
  Id,
  InventoryItem,
  InventoryKpis,
  InventoryListParams,
  MovementListParams,
  Product,
  ReceiveTransferInput,
  StockMovement,
  StockMovementType,
  StockTransfer,
  TransferItem,
} from "../types";
import { ApiError } from "../errors";
import {
  adjustmentDelta,
  availableQty,
  stockLevelKey,
  transferHasDiscrepancy,
  valuationTotals,
} from "@/features/inventory/inventory-math";
import { catalogAllProducts, findVariantStock, setVariantOnHand } from "./catalog";
import { seedStores, seedUser } from "./seed";

/**
 * In-memory inventory store for Stage 1. Owns the immutable stock-movement ledger and
 * stock transfers, and reads/mutates on-hand through the catalog store (single source
 * of truth for stock). Removed entirely during Stage 3. Not production data.
 */

const CURRENCY = "USD";

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function storeName(storeId: Id): string {
  return seedStores.find((s) => s.id === storeId)?.name ?? "Store";
}

interface VariantRef {
  product: Product;
  variant: Product["variants"][number];
}

function findVariant(variantId: Id): VariantRef | null {
  for (const product of catalogAllProducts()) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function findVariantBySku(sku: string): VariantRef | null {
  for (const product of catalogAllProducts()) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return null;
}

interface InventoryState {
  movements: StockMovement[];
  transfers: StockTransfer[];
}

let transferSeq = 8821;

function seedMovements(): StockMovement[] {
  const rows: StockMovement[] = [];
  const seeds: { sku: string; type: StockMovementType; delta: number; reason?: string; ago: number }[] = [
    { sku: "CO-401", type: "initial", delta: 85, ago: 30 },
    { sku: "CB-330", type: "purchase_receipt", delta: 120, ago: 6 },
    { sku: "AS-008", type: "sale", delta: -6, ago: 1 },
    { sku: "CB-012", type: "adjustment", delta: -2, reason: "damaged", ago: 2 },
    { sku: "MC-100-12BLK", type: "sale", delta: -3, ago: 1 },
    { sku: "SE-001", type: "adjustment", delta: 5, reason: "recount", ago: 4 },
  ];
  const store = seedStores[0]!;
  for (const seed of seeds) {
    const ref = findVariantBySku(seed.sku);
    if (!ref) continue;
    const row = ref.variant.stockByStore.find((s) => s.storeId === store.id);
    rows.push({
      id: uid("mv"),
      storeId: store.id,
      storeName: store.name,
      variantId: ref.variant.id,
      sku: ref.variant.sku,
      productName: ref.product.name,
      type: seed.type,
      quantityDelta: seed.delta,
      balanceAfter: row?.quantity ?? 0,
      reasonCode: seed.reason,
      actor: seedUser.fullName,
      createdAt: new Date(Date.now() - seed.ago * 86_400_000).toISOString(),
    });
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function seedTransferItems(skus: { sku: string; qty: number; received?: number }[]): TransferItem[] {
  const items: TransferItem[] = [];
  for (const entry of skus) {
    const ref = findVariantBySku(entry.sku);
    if (!ref) continue;
    items.push({
      variantId: ref.variant.id,
      sku: ref.variant.sku,
      productName: ref.product.name,
      variantName: ref.variant.variantName,
      quantity: entry.qty,
      quantityReceived: entry.received ?? 0,
    });
  }
  return items;
}

function seedTransfers(): StockTransfer[] {
  const [downtown, north, riverside] = seedStores;
  return [
    {
      id: uid("tr"),
      reference: `TR-${(transferSeq += 1)}`,
      fromStoreId: north!.id,
      fromStoreName: north!.name,
      toStoreId: downtown!.id,
      toStoreName: downtown!.name,
      status: "in_transit",
      items: seedTransferItems([{ sku: "CO-401", qty: 10 }, { sku: "TM-003", qty: 6 }]),
      createdBy: seedUser.fullName,
      createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      shippedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
      hasDiscrepancy: false,
    },
    {
      id: uid("tr"),
      reference: `TR-${(transferSeq += 1)}`,
      fromStoreId: downtown!.id,
      fromStoreName: downtown!.name,
      toStoreId: riverside!.id,
      toStoreName: riverside!.name,
      status: "draft",
      items: seedTransferItems([{ sku: "CB-330", qty: 24 }]),
      createdBy: seedUser.fullName,
      createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
      hasDiscrepancy: false,
    },
  ];
}

function freshState(): InventoryState {
  return { movements: seedMovements(), transfers: seedTransfers() };
}

const state: InventoryState = freshState();

// --- Reads ----------------------------------------------------------------------

function buildItemsForStore(storeId: Id): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const product of catalogAllProducts()) {
    for (const variant of product.variants) {
      const row = variant.stockByStore.find((s) => s.storeId === storeId);
      if (!row) continue;
      const onHand = row.quantity;
      const reserved = row.reserved ?? 0;
      items.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantName: variant.variantName,
        sku: variant.sku,
        barcode: variant.barcode,
        categoryName: product.categoryName,
        storeId,
        storeName: storeName(storeId),
        onHand,
        reserved,
        available: availableQty(onHand, reserved),
        binLocation: row.binLocation,
        reorderThreshold: variant.reorderThreshold,
        reorderQuantity: variant.reorderQuantity,
        unit: variant.unit,
        costPrice: variant.costPrice,
        sellPrice: variant.sellPrice,
        level: stockLevelKey(onHand, variant.reorderThreshold),
      });
    }
  }
  return items;
}

const LEVEL_ORDER: Record<string, number> = { out: 0, low: 1, ok: 2 };

export function inventoryList(params: InventoryListParams): InventoryItem[] {
  const q = (params.q ?? "").trim().toLowerCase();
  const level = params.level ?? "all";
  return buildItemsForStore(params.storeId)
    .filter((item) => {
      if (level !== "all" && item.level !== level) return false;
      if (!q) return true;
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.barcode ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => LEVEL_ORDER[a.level]! - LEVEL_ORDER[b.level]! || a.productName.localeCompare(b.productName));
}

export function inventoryKpis(storeId: Id): InventoryKpis {
  const items = buildItemsForStore(storeId);
  const totals = valuationTotals(items);
  const inTransit = state.transfers.filter(
    (t) => t.status === "in_transit" && (t.fromStoreId === storeId || t.toStoreId === storeId),
  ).length;
  return {
    valuationCost: { amountMinor: totals.costMinor, currency: CURRENCY },
    valuationRetail: { amountMinor: totals.retailMinor, currency: CURRENCY },
    inStock: items.filter((i) => i.level === "ok").length,
    low: items.filter((i) => i.level === "low").length,
    out: items.filter((i) => i.level === "out").length,
    inTransit,
  };
}

export function listMovements(params: MovementListParams): StockMovement[] {
  const type = params.type ?? "all";
  return state.movements
    .filter((m) => {
      if (m.storeId !== params.storeId) return false;
      if (params.variantId && m.variantId !== params.variantId) return false;
      if (type !== "all" && m.type !== type) return false;
      return true;
    })
    .map((m) => clone(m))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listTransfers(storeId?: Id): StockTransfer[] {
  return state.transfers
    .filter((t) => !storeId || t.fromStoreId === storeId || t.toStoreId === storeId)
    .map((t) => clone(t))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- Writes ---------------------------------------------------------------------

function appendMovement(entry: Omit<StockMovement, "id" | "createdAt" | "actor">): StockMovement {
  const movement: StockMovement = {
    ...entry,
    id: uid("mv"),
    actor: seedUser.fullName,
    createdAt: nowIso(),
  };
  state.movements.unshift(movement);
  return clone(movement);
}

export function createAdjustment(input: CreateAdjustmentInput): StockMovement {
  if (!input.supervisorPin.trim()) {
    throw new ApiError("OVERRIDE_REQUIRED", "Supervisor authorization is required.", { status: 403 });
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new ApiError("VALIDATION_FAILED", "Quantity must be a number ≥ 0.", { status: 422 });
  }
  const ref = findVariant(input.variantId);
  if (!ref) throw new ApiError("NOT_FOUND", "Variant not found.", { status: 404 });
  const current = findVariantStock(input.variantId, input.storeId);
  if (!current) throw new ApiError("NOT_FOUND", "Stock record not found.", { status: 404 });

  const delta = adjustmentDelta(input.type, current.onHand, input.quantity);
  const balanceAfter = setVariantOnHand(input.variantId, input.storeId, current.onHand + delta);
  return appendMovement({
    storeId: input.storeId,
    storeName: storeName(input.storeId),
    variantId: ref.variant.id,
    sku: ref.variant.sku,
    productName: ref.product.name,
    type: "adjustment",
    quantityDelta: delta,
    balanceAfter,
    reasonCode: input.reason,
    note: input.note?.trim() || undefined,
    referenceType: "adjustment",
  });
}

/**
 * Receive stock against a purchase order: increase on-hand and append an immutable
 * purchase_receipt movement. Returns the new balance. Used by the purchasing module.
 */
export function recordPurchaseReceipt(params: {
  storeId: Id;
  variantId: Id;
  quantity: number;
  referenceId: string;
}): number {
  const ref = findVariant(params.variantId);
  const current = findVariantStock(params.variantId, params.storeId);
  if (!ref || !current) throw new ApiError("NOT_FOUND", "Stock record not found.", { status: 404 });
  const balanceAfter = setVariantOnHand(params.variantId, params.storeId, current.onHand + params.quantity);
  appendMovement({
    storeId: params.storeId,
    storeName: storeName(params.storeId),
    variantId: ref.variant.id,
    sku: ref.variant.sku,
    productName: ref.product.name,
    type: "purchase_receipt",
    quantityDelta: params.quantity,
    balanceAfter,
    referenceType: "purchase_order",
    referenceId: params.referenceId,
  });
  return balanceAfter;
}

export function createTransfer(input: CreateTransferInput): StockTransfer {
  if (input.fromStoreId === input.toStoreId) {
    throw new ApiError("VALIDATION_FAILED", "Source and destination must differ.", { status: 422 });
  }
  const items = input.items
    .filter((i) => i.quantity > 0)
    .map((i) => {
      const ref = findVariant(i.variantId);
      if (!ref) throw new ApiError("NOT_FOUND", "Variant not found.", { status: 404 });
      return {
        variantId: ref.variant.id,
        sku: ref.variant.sku,
        productName: ref.product.name,
        variantName: ref.variant.variantName,
        quantity: Math.round(i.quantity),
        quantityReceived: 0,
      } satisfies TransferItem;
    });
  if (items.length === 0) {
    throw new ApiError("VALIDATION_FAILED", "Add at least one item to transfer.", { status: 422 });
  }
  const transfer: StockTransfer = {
    id: uid("tr"),
    reference: `TR-${(transferSeq += 1)}`,
    fromStoreId: input.fromStoreId,
    fromStoreName: storeName(input.fromStoreId),
    toStoreId: input.toStoreId,
    toStoreName: storeName(input.toStoreId),
    status: "draft",
    items,
    createdBy: seedUser.fullName,
    createdAt: nowIso(),
    hasDiscrepancy: false,
  };
  state.transfers.unshift(transfer);
  return clone(transfer);
}

function requireTransfer(id: Id): StockTransfer {
  const transfer = state.transfers.find((t) => t.id === id);
  if (!transfer) throw new ApiError("NOT_FOUND", "Transfer not found.", { status: 404 });
  return transfer;
}

export function shipTransfer(id: Id): StockTransfer {
  const transfer = requireTransfer(id);
  if (transfer.status !== "draft") {
    throw new ApiError("CONFLICT", "Only draft transfers can be shipped.", { status: 409 });
  }
  for (const item of transfer.items) {
    const current = findVariantStock(item.variantId, transfer.fromStoreId);
    const balanceAfter = setVariantOnHand(
      item.variantId,
      transfer.fromStoreId,
      (current?.onHand ?? 0) - item.quantity,
    );
    appendMovement({
      storeId: transfer.fromStoreId,
      storeName: transfer.fromStoreName,
      variantId: item.variantId,
      sku: item.sku,
      productName: item.productName,
      type: "transfer_out",
      quantityDelta: -item.quantity,
      balanceAfter,
      referenceType: "transfer",
      referenceId: transfer.id,
    });
  }
  transfer.status = "in_transit";
  transfer.shippedAt = nowIso();
  return clone(transfer);
}

export function receiveTransfer(input: ReceiveTransferInput): StockTransfer {
  const transfer = requireTransfer(input.id);
  if (transfer.status !== "in_transit") {
    throw new ApiError("CONFLICT", "Only in-transit transfers can be received.", { status: 409 });
  }
  const receivedMap = new Map(input.received.map((r) => [r.variantId, Math.max(0, Math.round(r.quantityReceived))]));
  for (const item of transfer.items) {
    const received = receivedMap.get(item.variantId) ?? item.quantity;
    item.quantityReceived = received;
    const current = findVariantStock(item.variantId, transfer.toStoreId);
    const balanceAfter = setVariantOnHand(
      item.variantId,
      transfer.toStoreId,
      (current?.onHand ?? 0) + received,
    );
    appendMovement({
      storeId: transfer.toStoreId,
      storeName: transfer.toStoreName,
      variantId: item.variantId,
      sku: item.sku,
      productName: item.productName,
      type: "transfer_in",
      quantityDelta: received,
      balanceAfter,
      referenceType: "transfer",
      referenceId: transfer.id,
    });
  }
  transfer.status = "received";
  transfer.receivedAt = nowIso();
  transfer.hasDiscrepancy = transferHasDiscrepancy(transfer.items);
  return clone(transfer);
}

export function cancelTransfer(id: Id): StockTransfer {
  const transfer = requireTransfer(id);
  if (transfer.status === "received" || transfer.status === "cancelled") {
    throw new ApiError("CONFLICT", "This transfer can no longer be cancelled.", { status: 409 });
  }
  if (transfer.status === "in_transit") {
    // Return shipped stock to the source store.
    for (const item of transfer.items) {
      const current = findVariantStock(item.variantId, transfer.fromStoreId);
      const balanceAfter = setVariantOnHand(
        item.variantId,
        transfer.fromStoreId,
        (current?.onHand ?? 0) + item.quantity,
      );
      appendMovement({
        storeId: transfer.fromStoreId,
        storeName: transfer.fromStoreName,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        type: "transfer_in",
        quantityDelta: item.quantity,
        balanceAfter,
        referenceType: "transfer",
        referenceId: transfer.id,
        note: "Cancelled transfer — stock returned to source.",
      });
    }
  }
  transfer.status = "cancelled";
  return clone(transfer);
}

/** Test-only: reset inventory + reseed from the current catalog. */
export function __resetInventory(): void {
  Object.assign(state, freshState());
}
