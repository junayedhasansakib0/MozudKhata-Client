"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { CreatePurchaseOrderInput, Id, PurchaseListParams, ReceivePurchaseInput } from "@/lib/data/types";

export const purchasesKey = ["purchases"] as const;

export function usePurchaseOrders(params: PurchaseListParams) {
  return useQuery({
    queryKey: [...purchasesKey, "list", params],
    queryFn: () => getDataSource().purchases.list(params),
  });
}

export function usePurchaseKpis() {
  return useQuery({
    queryKey: [...purchasesKey, "kpis"],
    queryFn: () => getDataSource().purchases.getKpis(),
  });
}

export function usePurchaseMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: purchasesKey });
    void qc.invalidateQueries({ queryKey: ["suppliers-dir"] });
    // Receiving changes stock, so refresh inventory + catalog views too.
    void qc.invalidateQueries({ queryKey: ["inventory"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["catalog-summary"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: CreatePurchaseOrderInput) => getDataSource().purchases.create(input),
      onSuccess: invalidate,
    }),
    submit: useMutation({
      mutationFn: (id: Id) => getDataSource().purchases.submit(id),
      onSuccess: invalidate,
    }),
    receive: useMutation({
      mutationFn: (input: ReceivePurchaseInput) => getDataSource().purchases.receive(input),
      onSuccess: invalidate,
    }),
    recordPayment: useMutation({
      mutationFn: ({ id, amountMinor }: { id: Id; amountMinor: number }) =>
        getDataSource().purchases.recordPayment(id, amountMinor),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: (id: Id) => getDataSource().purchases.cancel(id),
      onSuccess: invalidate,
    }),
  };
}
