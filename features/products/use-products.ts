"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type {
  BulkPriceAdjustment,
  Id,
  ProductInput,
  ProductListParams,
  ProductStatus,
} from "@/lib/data/types";

export const productsKey = ["products"] as const;
export const catalogSummaryKey = ["catalog-summary"] as const;

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: [...productsKey, params],
    queryFn: () => getDataSource().products.list(params),
  });
}

export function useCatalogSummary() {
  return useQuery({
    queryKey: catalogSummaryKey,
    queryFn: () => getDataSource().products.getSummary(),
  });
}

/** Invalidate every products list (params-keyed) plus the KPI summary. */
export function useCatalogInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: productsKey });
    void qc.invalidateQueries({ queryKey: catalogSummaryKey });
  };
}

export function useProductMutations() {
  const invalidate = useCatalogInvalidate();
  return {
    create: useMutation({
      mutationFn: (input: ProductInput) => getDataSource().products.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: ProductInput }) =>
        getDataSource().products.update(id, input),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: Id; status: ProductStatus }) =>
        getDataSource().products.setStatus(id, status),
      onSuccess: invalidate,
    }),
    bulkPrice: useMutation({
      mutationFn: ({ ids, adjustment }: { ids: Id[]; adjustment: BulkPriceAdjustment }) =>
        getDataSource().products.bulkUpdatePrice(ids, adjustment),
      onSuccess: invalidate,
    }),
    bulkCategory: useMutation({
      mutationFn: ({ ids, categoryId }: { ids: Id[]; categoryId: Id }) =>
        getDataSource().products.bulkChangeCategory(ids, categoryId),
      onSuccess: invalidate,
    }),
    bulkDeactivate: useMutation({
      mutationFn: (ids: Id[]) => getDataSource().products.bulkDeactivate(ids),
      onSuccess: invalidate,
    }),
  };
}
