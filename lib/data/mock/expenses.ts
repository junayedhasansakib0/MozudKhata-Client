import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseKpis,
  ExpenseListParams,
  Id,
} from "../types";
import { ApiError } from "../errors";
import { seedStores, seedUser } from "./seed";

/**
 * In-memory expense store for Stage 1 (CRUD + filters). Removed in Stage 3. Not
 * production data. Approval workflow is a backend `[DECISION REQUIRED]` — not modeled.
 */

const CURRENCY = "USD";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent & lease" },
  { value: "utilities", label: "Utilities" },
  { value: "payroll", label: "Payroll" },
  { value: "supplies", label: "Supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Other" },
];

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

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function seedExpenses(): Expense[] {
  const store = seedStores[0]!.id;
  const north = seedStores[1]?.id ?? store;
  const specs: { category: ExpenseCategory; major: number; description: string; days: number; storeId: Id }[] = [
    { category: "rent", major: 4200, description: "Downtown storefront — monthly rent", days: 2, storeId: store },
    { category: "payroll", major: 8650, description: "Barista team — bi-weekly", days: 3, storeId: store },
    { category: "utilities", major: 540, description: "Electricity & water", days: 5, storeId: store },
    { category: "supplies", major: 320, description: "Cups, lids, napkins", days: 6, storeId: store },
    { category: "marketing", major: 750, description: "Local social campaign", days: 8, storeId: north },
    { category: "maintenance", major: 410, description: "Espresso machine service", days: 11, storeId: store },
    { category: "logistics", major: 230, description: "Courier — bean delivery", days: 14, storeId: north },
    { category: "supplies", major: 180, description: "Cleaning supplies", days: 18, storeId: store },
    { category: "other", major: 95, description: "Misc. office", days: 22, storeId: store },
  ];
  return specs.map((s) => ({
    id: uid("exp"),
    storeId: s.storeId,
    storeName: storeName(s.storeId),
    category: s.category,
    amount: money(s.major * 100),
    description: s.description,
    spentAt: daysAgoIso(s.days),
    createdBy: seedUser.fullName,
    createdAt: daysAgoIso(s.days),
  }));
}

const state = { expenses: seedExpenses() };

export function listExpenses(params: ExpenseListParams = {}): Expense[] {
  const q = (params.q ?? "").trim().toLowerCase();
  return state.expenses
    .filter((e) => {
      if (params.storeId && e.storeId !== params.storeId) return false;
      if (params.category && params.category !== "all" && e.category !== params.category) return false;
      if (!q) return true;
      return (e.description ?? "").toLowerCase().includes(q) || e.category.includes(q);
    })
    .map(clone)
    .sort((a, b) => b.spentAt.localeCompare(a.spentAt));
}

export function getExpense(id: Id): Expense | null {
  const expense = state.expenses.find((e) => e.id === id);
  return expense ? clone(expense) : null;
}

export function expenseKpis(storeId?: Id): ExpenseKpis {
  const cutoff = Date.now() - 30 * 86_400_000;
  const scope = state.expenses.filter(
    (e) => (!storeId || e.storeId === storeId) && Date.parse(e.spentAt) >= cutoff,
  );
  const byCategory = new Map<ExpenseCategory, number>();
  let total = 0;
  for (const e of scope) {
    total += e.amount.amountMinor;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount.amountMinor);
  }
  let top: ExpenseKpis["topCategory"] = null;
  for (const [category, amount] of byCategory) {
    if (!top || amount > top.amount.amountMinor) top = { category, amount: money(amount) };
  }
  return { totalThisPeriod: money(total), topCategory: top, count: scope.length };
}

export function createExpense(input: ExpenseInput): Expense {
  if (!input.amountMinor || input.amountMinor <= 0) {
    throw new ApiError("VALIDATION_FAILED", "Amount must be greater than zero.", { status: 422 });
  }
  const expense: Expense = {
    id: uid("exp"),
    storeId: input.storeId,
    storeName: storeName(input.storeId),
    category: input.category,
    amount: money(input.amountMinor),
    description: input.description?.trim() || undefined,
    spentAt: input.spentAt || nowIso(),
    createdBy: seedUser.fullName,
    createdAt: nowIso(),
  };
  state.expenses.unshift(expense);
  return clone(expense);
}

export function updateExpense(id: Id, input: ExpenseInput): Expense {
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense) throw new ApiError("NOT_FOUND", "Expense not found.", { status: 404 });
  expense.storeId = input.storeId;
  expense.storeName = storeName(input.storeId);
  expense.category = input.category;
  expense.amount = money(input.amountMinor);
  expense.description = input.description?.trim() || undefined;
  expense.spentAt = input.spentAt || expense.spentAt;
  return clone(expense);
}

export function removeExpense(id: Id): void {
  state.expenses = state.expenses.filter((e) => e.id !== id);
}

/** All expenses (for reports). */
export function allExpenses(): Expense[] {
  return state.expenses.map(clone);
}

export function __resetExpenses(): void {
  state.expenses = seedExpenses();
}
