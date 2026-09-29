import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

/** Shape of the backend `GET /api/v1/health` response payload. */
export interface HealthStatus {
  status: string;
  uptime: number;
  version: string;
}

/** Polls the backend health endpoint to surface API connectivity in the UI. */
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthStatus>("/health"),
    refetchInterval: 30_000,
  });
}
