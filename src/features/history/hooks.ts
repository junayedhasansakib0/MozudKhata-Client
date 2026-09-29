import { useQuery } from "@tanstack/react-query";
import * as historyApi from "./api";
import type { MovementListParams } from "./types";

/** TanStack Query hooks for the global movement history (docs/api.md §Phase 08). */

export const historyKey = ["movements"] as const;

export function useOwnerMovements(params: MovementListParams) {
  return useQuery({
    queryKey: [...historyKey, params] as const,
    queryFn: () => historyApi.listOwnerMovements(params),
  });
}
