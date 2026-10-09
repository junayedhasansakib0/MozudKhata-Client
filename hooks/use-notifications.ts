"use client";

import { useQuery } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";

export const notificationsQueryKey = ["notifications"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => getDataSource().notifications.list(),
  });
}
