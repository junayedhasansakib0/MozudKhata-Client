import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryApi from "./api";
import type { MovementInput, ProductInput } from "./api";

/** TanStack Query hooks for inventory (mirrors features/auth/hooks.ts patterns). */

export const categoriesKey = ["categories"] as const;
export const productsKey = ["products"] as const;

// --- Categories ---

export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: [...categoriesKey, { includeArchived }] as const,
    queryFn: () => inventoryApi.listCategories(includeArchived),
  });
}

function invalidateCategories(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: categoriesKey });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => invalidateCategories(qc),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      inventoryApi.updateCategory(vars.id, { name: vars.name }),
    onSuccess: () => invalidateCategories(qc),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.archiveCategory,
    onSuccess: () => invalidateCategories(qc),
  });
}

export function useRestoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.restoreCategory,
    onSuccess: () => invalidateCategories(qc),
  });
}

// --- Products ---

export function useProducts(params: { page: number; pageSize: number; includeArchived?: boolean }) {
  return useQuery({
    queryKey: [...productsKey, params] as const,
    queryFn: () => inventoryApi.listProducts(params),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...productsKey, "detail", id] as const,
    queryFn: () => inventoryApi.getProduct(id as string),
    enabled: Boolean(id),
  });
}

function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: productsKey });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => inventoryApi.createProduct(input),
    onSuccess: () => invalidateProducts(qc),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: ProductInput }) =>
      inventoryApi.updateProduct(vars.id, vars.input),
    onSuccess: () => invalidateProducts(qc),
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.archiveProduct,
    onSuccess: () => invalidateProducts(qc),
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.restoreProduct,
    onSuccess: () => invalidateProducts(qc),
  });
}

// --- Stock movements ---

export function useProductMovements(productId: string | undefined) {
  return useQuery({
    queryKey: [...productsKey, "movements", productId] as const,
    queryFn: () => inventoryApi.listMovements(productId as string),
    enabled: Boolean(productId),
  });
}

export function useRecordMovement(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MovementInput) => inventoryApi.recordMovement(productId, input),
    // A movement changes the cached quantity, so refresh the product detail,
    // the list, and this product's history — all live under the "products" key.
    onSuccess: () => invalidateProducts(qc),
  });
}
