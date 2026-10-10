import type {
  CreateSaleInput,
  PosCategory,
  PosCustomer,
  PosProduct,
  SaleReceipt,
  TaxLine,
} from "../types";
import { seedStores, seedUser } from "./seed";
import { recordPosOrder } from "./sales";

const CATEGORIES: { id: string; name: string }[] = [
  { id: "cat_coffee", name: "Coffee & Espresso" },
  { id: "cat_tea", name: "Tea & Matcha" },
  { id: "cat_cold", name: "Cold Drinks" },
  { id: "cat_bakery", name: "Bakery" },
  { id: "cat_merch", name: "Merchandise" },
];

const CAT_NAME = new Map(CATEGORIES.map((c) => [c.id, c.name]));

function product(
  id: string,
  name: string,
  sku: string,
  barcode: string,
  categoryId: string,
  priceMajor: number,
  stock: number,
  unit = "each",
): PosProduct {
  return {
    id,
    name,
    sku,
    barcode,
    categoryId,
    categoryName: CAT_NAME.get(categoryId) ?? "",
    price: { amountMinor: Math.round(priceMajor * 100), currency: "USD" },
    stock,
    unit,
  };
}

const PRODUCTS: PosProduct[] = [
  product("p_flatwhite", "Signature Flat White", "CF-001", "8901240101", "cat_coffee", 4.75, 99),
  product("p_latte", "Iced Spanish Latte", "CF-008", "8901240102", "cat_coffee", 5.75, 68),
  product("p_espresso", "Double Espresso", "CF-002", "8901240103", "cat_coffee", 3.5, 120),
  product("p_cortado", "Cortado", "CF-004", "8901240104", "cat_coffee", 4.25, 54),
  product("p_matcha", "Ceremonial Grade Matcha", "TM-003", "8901240201", "cat_tea", 6.25, 31),
  product("p_chai", "Masala Chai Latte", "TM-005", "8901240202", "cat_tea", 5.0, 44),
  product("p_nitro", "Cold Brew Nitro 16oz", "CB-010", "8901240301", "cat_cold", 5.5, 42),
  product("p_lemonade", "Yuzu Lemonade", "CB-014", "8901240302", "cat_cold", 4.5, 25),
  product("p_croissant", "Almond Croissant", "BK-005", "8901240401", "cat_bakery", 4.5, 8),
  product("p_sourdough", "Avocado Sourdough Toast", "FD-014", "8901240402", "cat_bakery", 9.5, 25),
  product("p_cookie", "Brown Butter Cookie", "BK-009", "8901240403", "cat_bakery", 3.25, 60),
  product("p_beans", "Ethiopia Guji Washed 250g", "BN-019", "8901240501", "cat_merch", 18.0, 14),
  product("p_tumbler", "Mozud Ceramic Tumbler 12oz", "MC-002", "8901240502", "cat_merch", 24.0, 19),
  product("p_tote", "Mozud Canvas Tote", "MC-007", "8901240503", "cat_merch", 16.0, 37),
];

const CUSTOMERS: PosCustomer[] = [
  {
    id: "c_marcus",
    name: "Marcus Vance",
    phone: "+1 512-882-9014",
    loyaltyTier: "VIP Tier 2",
    loyaltyPoints: 340,
    loyaltyDiscountPct: 10,
  },
  {
    id: "c_elena",
    name: "Elena Rostova",
    phone: "+1 512-440-1180",
    loyaltyTier: "Member",
    loyaltyPoints: 85,
    loyaltyDiscountPct: 5,
  },
  {
    id: "c_sarah",
    name: "Sarah Jenkins",
    phone: "+1 737-212-4455",
    loyaltyTier: "Member",
    loyaltyPoints: 42,
    loyaltyDiscountPct: 5,
  },
  { id: "c_david", name: "David Okafor", phone: "+1 512-991-7781" },
];

const TAX_LINES: TaxLine[] = [{ id: "tax_state", name: "Sales Tax (8.25%)", rate: 0.0825 }];

export function posCategories(): PosCategory[] {
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    count: PRODUCTS.filter((p) => p.categoryId === c.id).length,
  }));
}

export function posProducts(): PosProduct[] {
  return PRODUCTS.map((p) => ({ ...p, price: { ...p.price } }));
}

export function posCustomers(query: string): PosCustomer[] {
  const q = query.trim().toLowerCase();
  const list = q
    ? CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q))
    : CUSTOMERS;
  return list.map((c) => ({ ...c }));
}

export function posTaxLines(): TaxLine[] {
  return TAX_LINES.map((t) => ({ ...t }));
}

// Idempotent mock sale: a repeated idempotency key returns the original receipt.
const salesByKey = new Map<string, SaleReceipt>();
let orderSeq = 8944;

export function createMockSale(input: CreateSaleInput): SaleReceipt {
  const existing = salesByKey.get(input.idempotencyKey);
  if (existing) return existing;

  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0);
  const discountTotal = Math.min(Math.max(input.discountTotalMinor, 0), subtotal);
  const discountedSubtotal = subtotal - discountTotal;
  const taxTotal = TAX_LINES.reduce((sum, t) => sum + Math.round(discountedSubtotal * t.rate), 0);
  const total = discountedSubtotal + taxTotal;
  const paid = input.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const change = Math.max(0, paid - total);
  const store = seedStores.find((s) => s.id === input.storeId);

  const receipt: SaleReceipt = {
    orderNumber: `#${(orderSeq += 1)}`,
    completedAt: new Date().toISOString(),
    storeName: store?.name ?? "Store",
    cashierName: seedUser.fullName,
    customerName: input.customerId
      ? CUSTOMERS.find((c) => c.id === input.customerId)?.name
      : undefined,
    currency: input.currency,
    lines: input.lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      unitPriceMinor: l.unitPriceMinor,
      lineTotalMinor: l.unitPriceMinor * l.quantity,
    })),
    subtotalMinor: subtotal,
    discountTotalMinor: discountTotal,
    taxTotalMinor: taxTotal,
    totalMinor: total,
    payments: input.payments,
    changeMinor: change,
  };
  salesByKey.set(input.idempotencyKey, receipt);
  recordPosOrder(input, receipt);
  return receipt;
}
