"use client";

import { useQuery } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { DateRangeKey } from "@/lib/data/repositories";

export function useDashboard(storeId: string | undefined, range: DateRangeKey) {
  return useQuery({
    queryKey: ["dashboard", storeId, range],
    queryFn: () => getDataSource().dashboard.getOverview({ storeId: storeId ?? "", range }),
    enabled: Boolean(storeId),
  });
}
