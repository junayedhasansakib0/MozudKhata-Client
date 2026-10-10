import type { ReportDataset, ReportKey, ReportParams } from "../types";
import { listCustomers } from "./customers";
import { allExpenses, EXPENSE_CATEGORIES } from "./expenses";
import { inventoryList } from "./inventory";
import { listPurchaseOrders, listSuppliers } from "./purchasing";
import { listOrders, ordersForCustomer } from "./sales";
import { seedStores } from "./seed";

/**
 * Report datasets for Stage 1, derived from the other mock stores so figures stay
 * coherent with the rest of the app. Each report returns KPIs + a bar series + a table.
 * Costing method remains a backend `[DECISION REQUIRED]`; profit uses captured cost.
 */

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
function money(minor: number): string {
  return fmt.format(minor / 100);
}

const RANGE_DAYS: Record<ReportParams["range"], number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

function withinRange(iso: string, range: ReportParams["range"]): boolean {
  return Date.parse(iso) >= Date.now() - RANGE_DAYS[range] * 86_400_000;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupSumByDay(entries: { iso: string; amount: number }[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const key = e.iso.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ label: dayLabel(key), value }));
}

function salesReport(params: ReportParams): ReportDataset {
  const orders = listOrders({ storeId: params.storeId }).filter(
    (o) => o.status !== "voided" && withinRange(o.createdAt, params.range),
  );
  const gross = orders.reduce((s, o) => s + o.total.amountMinor, 0);
  const refunds = orders.reduce((s, o) => s + o.refundedTotal.amountMinor, 0);
  const net = gross - refunds;
  const chart = groupSumByDay(orders.map((o) => ({ iso: o.createdAt, amount: o.total.amountMinor })));
  return {
    key: "sales",
    title: "Sales summary",
    description: "Gross sales, refunds, and net revenue over the selected period.",
    kpis: [
      { label: "Gross sales", value: money(gross) },
      { label: "Orders", value: String(orders.length) },
      { label: "Refunds", value: money(refunds) },
      { label: "Net sales", value: money(net) },
    ],
    chartLabel: "Gross sales by day",
    chart,
    columns: ["Order", "Date", "Customer", "Status", "Total"],
    rows: orders.map((o) => [
      o.orderNumber,
      dayLabel(o.createdAt),
      o.customerName ?? "Walk-in",
      o.status.replace("_", " "),
      money(o.total.amountMinor),
    ]),
  };
}

function profitReport(params: ReportParams): ReportDataset {
  const orders = listOrders({ storeId: params.storeId }).filter(
    (o) => o.status !== "voided" && withinRange(o.createdAt, params.range),
  );
  let revenue = 0;
  let cogs = 0;
  const byCategory = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      revenue += item.lineTotal.amountMinor;
      cogs += item.costPriceAtSale.amountMinor * item.quantity;
    }
  }
  const expenses = allExpenses().filter((e) => (!params.storeId || e.storeId === params.storeId) && withinRange(e.spentAt, params.range));
  const expenseTotal = expenses.reduce((s, e) => s + e.amount.amountMinor, 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenseTotal;
  // Margin contribution by product name (top lines).
  for (const o of orders) {
    for (const item of o.items) {
      byCategory.set(item.name, (byCategory.get(item.name) ?? 0) + (item.lineTotal.amountMinor - item.costPriceAtSale.amountMinor * item.quantity));
    }
  }
  const chart = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
  return {
    key: "profit",
    title: "Profit & margin",
    description: "Gross profit (revenue − COGS) and net profit after expenses.",
    kpis: [
      { label: "Revenue", value: money(revenue) },
      { label: "COGS", value: money(cogs) },
      { label: "Gross profit", value: money(grossProfit) },
      { label: "Net profit", value: money(netProfit) },
    ],
    chartLabel: "Gross margin by product",
    chart,
    columns: ["Metric", "Amount"],
    rows: [
      ["Revenue", money(revenue)],
      ["Cost of goods sold", money(cogs)],
      ["Gross profit", money(grossProfit)],
      ["Operating expenses", money(expenseTotal)],
      ["Net profit", money(netProfit)],
    ],
  };
}

function inventoryReport(params: ReportParams): ReportDataset {
  const storeId = params.storeId ?? seedStores[0]!.id;
  const items = inventoryList({ storeId, level: "all" });
  const cost = items.reduce((s, i) => s + i.onHand * i.costPrice.amountMinor, 0);
  const retail = items.reduce((s, i) => s + i.onHand * i.sellPrice.amountMinor, 0);
  const byCategory = new Map<string, number>();
  for (const i of items) byCategory.set(i.categoryName, (byCategory.get(i.categoryName) ?? 0) + i.onHand * i.costPrice.amountMinor);
  const chart = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  return {
    key: "inventory",
    title: "Inventory valuation",
    description: "Cost vs. retail valuation and stock health by SKU.",
    kpis: [
      { label: "Valuation (cost)", value: money(cost) },
      { label: "Valuation (retail)", value: money(retail) },
      { label: "Low stock", value: String(items.filter((i) => i.level === "low").length) },
      { label: "Out of stock", value: String(items.filter((i) => i.level === "out").length) },
    ],
    chartLabel: "Cost valuation by category",
    chart,
    columns: ["SKU", "Product", "On hand", "Cost", "Valuation", "Status"],
    rows: items.map((i) => [
      i.sku,
      i.productName,
      String(i.onHand),
      money(i.costPrice.amountMinor),
      money(i.onHand * i.costPrice.amountMinor),
      i.level,
    ]),
  };
}

function purchasesReport(params: ReportParams): ReportDataset {
  const orders = listPurchaseOrders({ storeId: params.storeId }).filter(
    (o) => o.status !== "cancelled" && o.status !== "draft" && withinRange(o.createdAt, params.range),
  );
  const spend = orders.reduce((s, o) => s + o.total.amountMinor, 0);
  const paid = orders.reduce((s, o) => s + o.amountPaid.amountMinor, 0);
  const bySupplier = new Map<string, number>();
  for (const o of orders) bySupplier.set(o.supplierName, (bySupplier.get(o.supplierName) ?? 0) + o.total.amountMinor);
  const chart = [...bySupplier.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  return {
    key: "purchases",
    title: "Purchases",
    description: "Committed purchase spend and outstanding balances by supplier.",
    kpis: [
      { label: "Total spend", value: money(spend) },
      { label: "Paid", value: money(paid) },
      { label: "Outstanding", value: money(spend - paid) },
      { label: "Orders", value: String(orders.length) },
    ],
    chartLabel: "Spend by supplier",
    chart,
    columns: ["PO", "Supplier", "Status", "Total", "Paid"],
    rows: orders.map((o) => [o.poNumber, o.supplierName, o.status.replace("_", " "), money(o.total.amountMinor), money(o.amountPaid.amountMinor)]),
  };
}

function customersReport(): ReportDataset {
  const customers = listCustomers();
  const rows = customers.map((c) => {
    const orders = ordersForCustomer(c.id).filter((o) => o.status !== "voided");
    const spent = orders.reduce((s, o) => s + o.total.amountMinor, 0);
    return { name: c.name, orders: orders.length, spent, balance: c.balance.amountMinor };
  });
  rows.sort((a, b) => b.spent - a.spent);
  const chart = rows.slice(0, 6).map((r) => ({ label: r.name, value: r.spent }));
  return {
    key: "customers",
    title: "Customers",
    description: "Top customers by spend and outstanding house-credit balances.",
    kpis: [
      { label: "Customers", value: String(customers.length) },
      { label: "Total spend", value: money(rows.reduce((s, r) => s + r.spent, 0)) },
      { label: "Receivables", value: money(rows.reduce((s, r) => s + r.balance, 0)) },
    ],
    chartLabel: "Spend by customer",
    chart,
    columns: ["Customer", "Orders", "Spent", "Balance"],
    rows: rows.map((r) => [r.name, String(r.orders), money(r.spent), money(r.balance)]),
  };
}

function suppliersReport(): ReportDataset {
  const suppliers = listSuppliers();
  const chart = suppliers
    .map((s) => ({ label: s.name, value: s.outstanding.amountMinor }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);
  return {
    key: "suppliers",
    title: "Suppliers",
    description: "Supplier order volume and outstanding payables.",
    kpis: [
      { label: "Suppliers", value: String(suppliers.length) },
      { label: "Outstanding", value: money(suppliers.reduce((s, x) => s + x.outstanding.amountMinor, 0)) },
      { label: "Active", value: String(suppliers.filter((s) => s.status === "active").length) },
    ],
    chartLabel: "Outstanding by supplier",
    chart,
    columns: ["Supplier", "Orders", "Outstanding", "Status"],
    rows: suppliers.map((s) => [s.name, String(s.orderCount), money(s.outstanding.amountMinor), s.status]),
  };
}

function expensesReport(params: ReportParams): ReportDataset {
  const expenses = allExpenses().filter((e) => (!params.storeId || e.storeId === params.storeId) && withinRange(e.spentAt, params.range));
  const total = expenses.reduce((s, e) => s + e.amount.amountMinor, 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount.amountMinor);
  const label = (key: string) => EXPENSE_CATEGORIES.find((c) => c.value === key)?.label ?? key;
  const chart = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([k, value]) => ({ label: label(k), value }));
  return {
    key: "expenses",
    title: "Expenses",
    description: "Operating expenses by category over the selected period.",
    kpis: [
      { label: "Total expenses", value: money(total) },
      { label: "Entries", value: String(expenses.length) },
      { label: "Categories", value: String(byCategory.size) },
    ],
    chartLabel: "Expenses by category",
    chart,
    columns: ["Date", "Category", "Store", "Description", "Amount"],
    rows: expenses.map((e) => [dayLabel(e.spentAt), label(e.category), e.storeName, e.description ?? "—", money(e.amount.amountMinor)]),
  };
}

function taxReport(params: ReportParams): ReportDataset {
  const orders = listOrders({ storeId: params.storeId }).filter(
    (o) => o.status !== "voided" && withinRange(o.createdAt, params.range),
  );
  const taxTotal = orders.reduce((s, o) => s + o.taxTotal.amountMinor, 0);
  const taxable = orders.reduce((s, o) => s + o.subtotal.amountMinor, 0);
  const chart = groupSumByDay(orders.map((o) => ({ iso: o.createdAt, amount: o.taxTotal.amountMinor })));
  return {
    key: "tax",
    title: "Tax collected",
    description: "Tax collected (a liability, excluded from profit) by day.",
    kpis: [
      { label: "Tax collected", value: money(taxTotal) },
      { label: "Taxable sales", value: money(taxable) },
      { label: "Orders", value: String(orders.length) },
    ],
    chartLabel: "Tax collected by day",
    chart,
    columns: ["Order", "Date", "Taxable", "Tax"],
    rows: orders.map((o) => [o.orderNumber, dayLabel(o.createdAt), money(o.subtotal.amountMinor), money(o.taxTotal.amountMinor)]),
  };
}

export function getReport(key: ReportKey, params: ReportParams): ReportDataset {
  switch (key) {
    case "sales":
      return salesReport(params);
    case "profit":
      return profitReport(params);
    case "inventory":
      return inventoryReport(params);
    case "purchases":
      return purchasesReport(params);
    case "customers":
      return customersReport();
    case "suppliers":
      return suppliersReport();
    case "expenses":
      return expensesReport(params);
    case "tax":
      return taxReport(params);
  }
}

export const REPORTS: { key: ReportKey; title: string; description: string }[] = [
  { key: "sales", title: "Sales summary", description: "Gross, refunds, net revenue" },
  { key: "profit", title: "Profit & margin", description: "Gross and net profit" },
  { key: "inventory", title: "Inventory valuation", description: "Cost vs retail, stock health" },
  { key: "purchases", title: "Purchases", description: "Spend and payables by supplier" },
  { key: "customers", title: "Customers", description: "Top customers, receivables" },
  { key: "suppliers", title: "Suppliers", description: "Volume and payables" },
  { key: "expenses", title: "Expenses", description: "Operating expenses by category" },
  { key: "tax", title: "Tax collected", description: "Tax liability by day" },
];
