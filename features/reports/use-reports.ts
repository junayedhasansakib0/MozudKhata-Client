"use client";

import { useQuery } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { ReportKey, ReportParams } from "@/lib/data/types";

export const reportsKey = ["reports"] as const;

export function useReport(key: ReportKey, params: ReportParams) {
  return useQuery({
    queryKey: [...reportsKey, key, params],
    queryFn: () => getDataSource().reports.get(key, params),
  });
}
