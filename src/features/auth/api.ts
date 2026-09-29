import { apiFetch } from "@/lib/api";
import type { User } from "./types";

/** All auth/account HTTP calls, routed through the typed API client. */

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name?: string;
}

export function getCurrentUser(): Promise<User> {
  return apiFetch<{ user: User }>("/auth/me").then((d) => d.user);
}

export function login(input: Credentials): Promise<User> {
  return apiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.user);
}

export function register(input: RegisterPayload): Promise<User> {
  return apiFetch<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((d) => d.user);
}

export function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" });
}

export function updateProfile(input: { name: string | null }): Promise<User> {
  return apiFetch<{ user: User }>("/account", {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((d) => d.user);
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/account/password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
