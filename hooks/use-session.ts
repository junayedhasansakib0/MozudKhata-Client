"use client";

import { useQuery } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";

export const sessionQueryKey = ["session"] as const;

/** Current user, tenant, stores, and active store (mock in Stage 1). */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => getDataSource().session.getCurrentSession(),
  });
}
