import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import * as authApi from "./api";
import type { User } from "./types";

export const currentUserKey = ["auth", "me"] as const;

/**
 * Current session's user, or null when unauthenticated. A 401 is a normal
 * "logged out" state, not an error, so it resolves to null instead of throwing.
 */
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: currentUserKey,
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => qc.setQueryData(currentUserKey, user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => qc.setQueryData(currentUserKey, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(currentUserKey, null);
      // Drop cached, now-inaccessible data for the previous user.
      void qc.invalidateQueries();
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => qc.setQueryData(currentUserKey, user),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword });
}
