import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

/**
 * Shared TanStack Query client. Auth/permission failures are not retried;
 * transient errors get a single retry. Tune per-query as features land.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (
            ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "VALIDATION_ERROR"].includes(
              error.code,
            )
          ) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});
