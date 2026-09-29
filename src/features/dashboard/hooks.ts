import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "./api";

/** TanStack Query hook for the dashboard metrics (mirrors inventory hooks). */

export const dashboardKey = ["dashboard"] as const;

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: dashboardApi.getDashboard,
  });
}
