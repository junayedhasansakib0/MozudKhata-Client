import type { RoleKey } from "@/lib/data/types";

// Versioned key (client-localstorage-schema best practice).
const KEY = "mozudkhata.auth.v1";

export interface AuthUserState {
  id: string;
  email: string;
  fullName: string;
  role: RoleKey;
  emailVerified: boolean;
}

interface StoredAuth {
  token: string;
  user: AuthUserState;
}

export type AuthSnapshot =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; token: string; user: AuthUserState };

const LOADING: AuthSnapshot = { status: "loading" };
const UNAUTH: AuthSnapshot = { status: "unauthenticated" };

const listeners = new Set<() => void>();
// Memoize the parsed snapshot by raw string so getSnapshot returns a stable reference.
let cache: { raw: string | null; snapshot: AuthSnapshot } | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): AuthSnapshot {
  if (!raw) return UNAUTH;
  try {
    const data = JSON.parse(raw) as StoredAuth;
    if (!data?.token || !data.user) return UNAUTH;
    return { status: "authenticated", token: data.token, user: data.user };
  } catch {
    return UNAUTH;
  }
}

export function getSnapshot(): AuthSnapshot {
  const raw = readRaw();
  if (!cache || cache.raw !== raw) {
    cache = { raw, snapshot: parse(raw) };
  }
  return cache.snapshot;
}

// Server/hydration render: unknown until the client reads localStorage.
export function getServerSnapshot(): AuthSnapshot {
  return LOADING;
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function writeAuth(value: StoredAuth | null): void {
  try {
    if (value) window.localStorage.setItem(KEY, JSON.stringify(value));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* localStorage unavailable — ignore */
  }
  cache = null;
  listeners.forEach((listener) => listener());
}

export function patchUser(update: Partial<AuthUserState>): void {
  const current = getSnapshot();
  if (current.status !== "authenticated") return;
  writeAuth({ token: current.token, user: { ...current.user, ...update } });
}
