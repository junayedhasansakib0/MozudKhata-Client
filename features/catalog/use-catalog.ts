"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { CategoryInput } from "@/lib/data/repositories";
import type { Id } from "@/lib/data/types";

export const categoriesKey = ["categories"] as const;
export const brandsKey = ["brands"] as const;
export const taxRatesKey = ["tax-rates"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => getDataSource().categories.list(),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: brandsKey,
    queryFn: () => getDataSource().brands.list(),
  });
}

export function useTaxRates() {
  return useQuery({
    queryKey: taxRatesKey,
    queryFn: () => getDataSource().taxRates.list(),
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: categoriesKey });
    void qc.invalidateQueries({ queryKey: ["products"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: CategoryInput) => getDataSource().categories.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: CategoryInput }) =>
        getDataSource().categories.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: Id) => getDataSource().categories.remove(id),
      onSuccess: invalidate,
    }),
  };
}

export function useBrandMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: brandsKey });
    void qc.invalidateQueries({ queryKey: ["products"] });
  };
  return {
    create: useMutation({
      mutationFn: (input: { name: string }) => getDataSource().brands.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: { name: string } }) =>
        getDataSource().brands.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: Id) => getDataSource().brands.remove(id),
      onSuccess: invalidate,
    }),
  };
}
