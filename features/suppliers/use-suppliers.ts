"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { Id, SupplierInput, SupplierStatus } from "@/lib/data/types";

export const suppliersKey = ["suppliers-dir"] as const;

export function useSuppliers() {
  return useQuery({
    queryKey: suppliersKey,
    queryFn: () => getDataSource().suppliers.list(),
  });
}

export function useSupplierHistory(id: string | null) {
  return useQuery({
    queryKey: [...suppliersKey, "history", id],
    queryFn: () => getDataSource().suppliers.history(id as string),
    enabled: id !== null,
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: suppliersKey });
    void qc.invalidateQueries({ queryKey: ["purchases"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: SupplierInput) => getDataSource().suppliers.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: SupplierInput }) =>
        getDataSource().suppliers.update(id, input),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: Id; status: SupplierStatus }) =>
        getDataSource().suppliers.setStatus(id, status),
      onSuccess: invalidate,
    }),
  };
}
