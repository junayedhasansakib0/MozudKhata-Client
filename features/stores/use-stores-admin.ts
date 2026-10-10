"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { Id, StoreInput } from "@/lib/data/types";

export const storesAdminKey = ["stores-admin"] as const;

export function useStoresAdmin() {
  return useQuery({
    queryKey: storesAdminKey,
    queryFn: () => getDataSource().stores.list(),
  });
}

export function useStoreMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: storesAdminKey });
  return {
    create: useMutation({
      mutationFn: (input: StoreInput) => getDataSource().stores.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: StoreInput }) => getDataSource().stores.update(id, input),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: Id; status: "active" | "inactive" }) =>
        getDataSource().stores.setStatus(id, status),
      onSuccess: invalidate,
    }),
  };
}
