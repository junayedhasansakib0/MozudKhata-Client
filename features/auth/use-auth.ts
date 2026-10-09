"use client";

import * as React from "react";

import { getDataSource } from "@/lib/data/provider";
import type { SignupInput } from "@/lib/data/repositories";
import type { RoleKey } from "@/lib/data/types";
import { getServerSnapshot, getSnapshot, patchUser, subscribe, writeAuth } from "./auth-store";

/**
 * Mock authentication (Stage 1). Backed by the swappable AuthRepository; the real
 * token flow replaces the repository in Stage 3 with no change to callers. `role` is a
 * demo override so later phases can exercise RBAC gating.
 */
export function useAuth() {
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = React.useCallback(async (email: string, password: string, role?: RoleKey) => {
    const { user, token } = await getDataSource().auth.login(email, password);
    writeAuth({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: role ?? user.role,
        emailVerified: true,
      },
    });
  }, []);

  const signup = React.useCallback(async (input: SignupInput, role?: RoleKey) => {
    const { user, token } = await getDataSource().auth.signup(input);
    writeAuth({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: role ?? user.role,
        emailVerified: false,
      },
    });
  }, []);

  const logout = React.useCallback(() => writeAuth(null), []);
  const selectRole = React.useCallback((role: RoleKey) => patchUser({ role }), []);
  const confirmEmail = React.useCallback(() => patchUser({ emailVerified: true }), []);

  return { ...snapshot, login, signup, logout, selectRole, confirmEmail };
}
