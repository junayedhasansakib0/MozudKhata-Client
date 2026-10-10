import type { ExpenseCategory } from "@/lib/data/types";

/** Display labels for expense categories (UI mirror of the backend list). */
export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent & lease" },
  { value: "utilities", label: "Utilities" },
  { value: "payroll", label: "Payroll" },
  { value: "supplies", label: "Supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Other" },
];

export function expenseCategoryLabel(value: ExpenseCategory): string {
  return EXPENSE_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}
