import { apiFetch } from "@/lib/api";
import type { DashboardMetrics } from "./types";

/** Dashboard HTTP calls, routed through the typed API client (docs/api.md §Phase 07). */

export function getDashboard(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/dashboard");
}
