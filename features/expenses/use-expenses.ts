"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { ExpenseInput, ExpenseListParams, Id } from "@/lib/data/types";

export const expensesKey = ["expenses"] as const;

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: [...expensesKey, "list", params],
    queryFn: () => getDataSource().expenses.list(params),
  });
}

export function useExpenseKpis(storeId: string | undefined) {
  return useQuery({
    queryKey: [...expensesKey, "kpis", storeId],
    queryFn: () => getDataSource().expenses.getKpis({ storeId }),
  });
}

export function useExpenseMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: expensesKey });
    void qc.invalidateQueries({ queryKey: ["reports"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: ExpenseInput) => getDataSource().expenses.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: ExpenseInput }) =>
        getDataSource().expenses.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: Id) => getDataSource().expenses.remove(id),
      onSuccess: invalidate,
    }),
  };
}
