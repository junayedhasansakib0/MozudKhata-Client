import type { DateRangeKey } from "../repositories";
import type {
  CategorySlice,
  DashboardData,
  HourlyPoint,
  LowStockItem,
  Money,
  RecentTransaction,
  TopProduct,
} from "../types";

function usd(major: number): Money {
  return { amountMinor: Math.round(major * 100), currency: "USD" };
}

// Deterministic 0..1 hash so a given (store, range) always renders the same data.
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function spark(seed: number, points = 12): number[] {
  const out: number[] = [];
  let value = 40 + seed * 30;
  for (let i = 0; i < points; i += 1) {
    value += Math.sin(i * 1.3 + seed * 6) * 8 + (hash(`${seed}:${i}`) - 0.4) * 10;
    out.push(Math.max(8, Math.round(value)));
  }
  return out;
}

const RANGE_FACTOR: Record<DateRangeKey, number> = { today: 1, "7d": 6.4, "30d": 27, "90d": 82 };

const CATEGORY_SHARES: [string, number][] = [
  ["Specialty Beverages", 0.42],
  ["Coffee Beans", 0.23],
  ["Food", 0.19],
  ["Merchandise", 0.09],
  ["Roasted Coffee Beans", 0.07],
];

const HOURS = ["7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p"];

export function buildDashboard(storeId: string, range: DateRangeKey): DashboardData {
  const store = 0.7 + hash(storeId) * 0.7; // 0.7..1.4
  const factor = RANGE_FACTOR[range] * store;

  const grossMajor = 18240 * factor;
  const netMajor = grossMajor * 0.32;
  const orders = Math.round(486 * factor);
  const aovMajor = grossMajor / Math.max(orders, 1);

  const kpis: DashboardData["kpis"] = {
    netProfit: { value: usd(netMajor), deltaPct: 14.2, spark: spark(store + 1) },
    grossSales: { value: usd(grossMajor), deltaPct: 8.6, spark: spark(store + 2) },
    avgOrderValue: { value: usd(aovMajor), deltaPct: 2.3, spark: spark(store + 3) },
    totalOrders: { value: orders, deltaPct: 6.1, spark: spark(store + 4) },
  };

  const hourly: HourlyPoint[] = HOURS.map((hour, i) => {
    const shape = Math.sin((i / (HOURS.length - 1)) * Math.PI) * 0.7 + 0.3;
    const bump = i === 2 || i === 5 ? 1.25 : 1; // morning + lunch peaks
    return { hour, sales: Math.round(1600 * shape * bump * store * 100) };
  });

  const categories: CategorySlice[] = CATEGORY_SHARES.map(([category, share]) => ({
    category,
    amount: Math.round(grossMajor * share * 100),
  }));

  const topProducts: TopProduct[] = [
    {
      id: "p1",
      name: "Signature Flat White",
      unitsSold: Math.round(312 * factor),
      revenue: usd(1483 * factor),
    },
    {
      id: "p2",
      name: "Cold Brew Nitro 16oz",
      unitsSold: Math.round(268 * factor),
      revenue: usd(1474 * factor),
    },
    {
      id: "p3",
      name: "Ethiopia Guji Washed 250g",
      unitsSold: Math.round(96 * factor),
      revenue: usd(1555 * factor),
    },
    {
      id: "p4",
      name: "Almond Croissant",
      unitsSold: Math.round(204 * factor),
      revenue: usd(918 * factor),
    },
    {
      id: "p5",
      name: "Mozud Ceramic Tumbler 12oz",
      unitsSold: Math.round(41 * factor),
      revenue: usd(984 * factor),
    },
  ];

  const lowStock: LowStockItem[] = [
    {
      id: "s1",
      name: "Cold Brew Filter Mesh 50pk",
      sku: "CB-012",
      onHand: 0,
      threshold: 10,
      urgency: "out",
    },
    {
      id: "s2",
      name: "Ethiopian Yirgacheffe 1kg",
      sku: "EY-102",
      onHand: 4,
      threshold: 20,
      urgency: "low",
    },
    {
      id: "s3",
      name: "Oat Milk Barista 1L",
      sku: "OM-044",
      onHand: 12,
      threshold: 48,
      urgency: "low",
    },
    {
      id: "s4",
      name: "Vanilla Bean Syrup 750ml",
      sku: "SY-009",
      onHand: 6,
      threshold: 24,
      urgency: "low",
    },
  ];

  const recentTransactions: RecentTransaction[] = [
    {
      id: "t1",
      orderNumber: "#8943",
      customer: "Marcus Vance",
      amount: usd(34.32),
      method: "card",
      status: "completed",
      at: new Date(Date.now() - 2 * 60_000).toISOString(),
    },
    {
      id: "t2",
      orderNumber: "#8942",
      customer: "Walk-in",
      amount: usd(11.2),
      method: "cash",
      status: "completed",
      at: new Date(Date.now() - 9 * 60_000).toISOString(),
    },
    {
      id: "t3",
      orderNumber: "#8941",
      customer: "Elena Rostova",
      amount: usd(67.84),
      method: "qr_wallet",
      status: "completed",
      at: new Date(Date.now() - 23 * 60_000).toISOString(),
    },
    {
      id: "t4",
      orderNumber: "#8940",
      customer: "Walk-in",
      amount: usd(24.75),
      method: "card",
      status: "refunded",
      at: new Date(Date.now() - 41 * 60_000).toISOString(),
    },
    {
      id: "t5",
      orderNumber: "#8939",
      customer: "Sarah Jenkins",
      amount: usd(42.5),
      method: "house_credit",
      status: "completed",
      at: new Date(Date.now() - 58 * 60_000).toISOString(),
    },
  ];

  const currentCashMajor = 2840 * store;
  const cashDrawer = {
    openingFloat: usd(450),
    currentCash: usd(currentCashMajor),
    expectedCash: usd(currentCashMajor + 85),
    projectedClose: usd(currentCashMajor * 1.35),
  };

  return { kpis, hourly, categories, topProducts, lowStock, recentTransactions, cashDrawer };
}
