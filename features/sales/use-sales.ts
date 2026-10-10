"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { CreateRefundInput, SalesListParams } from "@/lib/data/types";

export const salesKey = ["sales"] as const;

export function useSalesOrders(params: SalesListParams) {
  return useQuery({
    queryKey: [...salesKey, "list", params],
    queryFn: () => getDataSource().sales.list(params),
  });
}

export function useSalesKpis(storeId: string | undefined) {
  return useQuery({
    queryKey: [...salesKey, "kpis", storeId],
    queryFn: () => getDataSource().sales.getKpis({ storeId }),
  });
}

export function useRefundMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRefundInput) => getDataSource().sales.createRefund(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salesKey });
      void qc.invalidateQueries({ queryKey: ["customers-dir"] });
      // Restock refunds touch the inventory ledger + stock.
      void qc.invalidateQueries({ queryKey: ["inventory"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
