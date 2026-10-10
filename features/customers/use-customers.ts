"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { CustomerInput, CustomerStatus, Id } from "@/lib/data/types";

export const customersKey = ["customers-dir"] as const;

export function useCustomers() {
  return useQuery({
    queryKey: customersKey,
    queryFn: () => getDataSource().customers.list(),
  });
}

export function useCustomerOrders(customerId: string | null) {
  return useQuery({
    queryKey: [...customersKey, "orders", customerId],
    queryFn: () => getDataSource().sales.listForCustomer(customerId as string),
    enabled: customerId !== null,
  });
}

export function useCustomerMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: customersKey });
  return {
    create: useMutation({
      mutationFn: (input: CustomerInput) => getDataSource().customers.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: CustomerInput }) =>
        getDataSource().customers.update(id, input),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: Id; status: CustomerStatus }) =>
        getDataSource().customers.setStatus(id, status),
      onSuccess: invalidate,
    }),
  };
}
