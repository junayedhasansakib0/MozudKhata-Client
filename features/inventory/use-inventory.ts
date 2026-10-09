"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type {
  CreateAdjustmentInput,
  CreateTransferInput,
  Id,
  InventoryListParams,
  MovementListParams,
  ReceiveTransferInput,
} from "@/lib/data/types";

export const inventoryKey = ["inventory"] as const;

export function useInventoryItems(params: InventoryListParams | null) {
  return useQuery({
    queryKey: [...inventoryKey, "items", params],
    queryFn: () => getDataSource().inventory.listItems(params as InventoryListParams),
    enabled: params !== null,
  });
}

export function useInventoryKpis(storeId: string | undefined) {
  return useQuery({
    queryKey: [...inventoryKey, "kpis", storeId],
    queryFn: () => getDataSource().inventory.getKpis({ storeId: storeId as string }),
    enabled: Boolean(storeId),
  });
}

export function useMovements(params: MovementListParams | null) {
  return useQuery({
    queryKey: [...inventoryKey, "movements", params],
    queryFn: () => getDataSource().inventory.listMovements(params as MovementListParams),
    enabled: params !== null,
  });
}

export function useTransfers(storeId: string | undefined) {
  return useQuery({
    queryKey: [...inventoryKey, "transfers", storeId],
    queryFn: () => getDataSource().inventory.listTransfers({ storeId }),
    enabled: Boolean(storeId),
  });
}

/** Stock mutations invalidate inventory, catalog stock views, and KPI summaries. */
function useInventoryInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: inventoryKey });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["catalog-summary"] });
  };
}

export function useInventoryMutations() {
  const invalidate = useInventoryInvalidate();
  return {
    adjust: useMutation({
      mutationFn: (input: CreateAdjustmentInput) => getDataSource().inventory.createAdjustment(input),
      onSuccess: invalidate,
    }),
    createTransfer: useMutation({
      mutationFn: (input: CreateTransferInput) => getDataSource().inventory.createTransfer(input),
      onSuccess: invalidate,
    }),
    ship: useMutation({
      mutationFn: (id: Id) => getDataSource().inventory.shipTransfer(id),
      onSuccess: invalidate,
    }),
    receive: useMutation({
      mutationFn: (input: ReceiveTransferInput) => getDataSource().inventory.receiveTransfer(input),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: (id: Id) => getDataSource().inventory.cancelTransfer(id),
      onSuccess: invalidate,
    }),
  };
}
