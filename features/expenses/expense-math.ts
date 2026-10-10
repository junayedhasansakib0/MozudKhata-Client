import type { Expense, ExpenseCategory } from "@/lib/data/types";

/** Pure expense aggregation helpers (minor units). */

export function expensesTotalMinor(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount.amountMinor, 0);
}

export function totalsByCategory(expenses: Expense[]): { category: ExpenseCategory; amountMinor: number }[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount.amountMinor);
  return [...map.entries()]
    .map(([category, amountMinor]) => ({ category, amountMinor }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
}
