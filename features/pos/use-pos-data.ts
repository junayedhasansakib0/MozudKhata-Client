"use client";

import { useQuery } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";

export function usePosProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["pos", "products", storeId],
    queryFn: () => getDataSource().pos.listProducts({ storeId: storeId ?? "" }),
    enabled: Boolean(storeId),
  });
}

export function usePosCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ["pos", "categories", storeId],
    queryFn: () => getDataSource().pos.listCategories({ storeId: storeId ?? "" }),
    enabled: Boolean(storeId),
  });
}

export function usePosTaxLines(storeId: string | undefined) {
  return useQuery({
    queryKey: ["pos", "tax", storeId],
    queryFn: () => getDataSource().pos.getTaxLines({ storeId: storeId ?? "" }),
    enabled: Boolean(storeId),
  });
}

export function usePosCustomers(query: string) {
  return useQuery({
    queryKey: ["pos", "customers", query],
    queryFn: () => getDataSource().pos.searchCustomers(query),
  });
}
