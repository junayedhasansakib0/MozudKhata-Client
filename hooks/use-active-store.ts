"use client";

import * as React from "react";

// Versioned key (see client-localstorage-schema best practice).
const STORAGE_KEY = "mozudkhata.activeStore.v1";

const listeners = new Set<() => void>();

function readStore(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStore(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* localStorage unavailable — ignore */
  }
  // Notify same-tab subscribers (the "storage" event only fires in other tabs).
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export interface ActiveStore {
  /** Null until the user (or session default) selects a store. */
  activeStoreId: string | null;
  setActiveStoreId: (id: string) => void;
}

/**
 * Active-store selection persisted in localStorage. Uses useSyncExternalStore so the
 * persisted value is read without a hydration mismatch or setState-in-effect.
 */
export function useActiveStore(): ActiveStore {
  const activeStoreId = React.useSyncExternalStore(subscribe, readStore, () => null);
  const setActiveStoreId = React.useCallback((id: string) => writeStore(id), []);
  return { activeStoreId, setActiveStoreId };
}
