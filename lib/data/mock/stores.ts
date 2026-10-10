import type { Id, Store, StoreInput } from "../types";
import { ApiError } from "../errors";
import { seedStores } from "./seed";

/**
 * Mutable stores store for Stage 1 admin CRUD. Seeded from seed.ts. The session/
 * store-switcher still read the static seed; admin edits live here. Removed in Stage 3.
 */

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const state = { stores: seedStores.map(clone) };

export function listStoresAdmin(): Store[] {
  return state.stores.map(clone);
}

export function getStoreAdmin(id: Id): Store | null {
  const store = state.stores.find((s) => s.id === id);
  return store ? clone(store) : null;
}

export function createStore(input: StoreInput): Store {
  if (!input.name.trim()) throw new ApiError("VALIDATION_FAILED", "Store name is required.", { status: 422 });
  if (!input.code.trim()) throw new ApiError("VALIDATION_FAILED", "Store code is required.", { status: 422 });
  if (state.stores.some((s) => s.code.toLowerCase() === input.code.trim().toLowerCase())) {
    throw new ApiError("CONFLICT", "A store with this code already exists.", { status: 409 });
  }
  const store: Store = {
    id: uid("store"),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    city: input.city.trim(),
    currency: input.currency || "USD",
    status: input.status,
  };
  state.stores.push(store);
  return clone(store);
}

export function updateStore(id: Id, input: StoreInput): Store {
  const store = state.stores.find((s) => s.id === id);
  if (!store) throw new ApiError("NOT_FOUND", "Store not found.", { status: 404 });
  store.name = input.name.trim() || store.name;
  store.code = input.code.trim().toUpperCase() || store.code;
  store.city = input.city.trim();
  store.currency = input.currency || store.currency;
  store.status = input.status;
  return clone(store);
}

export function setStoreStatus(id: Id, status: "active" | "inactive"): Store {
  const store = state.stores.find((s) => s.id === id);
  if (!store) throw new ApiError("NOT_FOUND", "Store not found.", { status: 404 });
  store.status = status;
  return clone(store);
}

export function __resetStores(): void {
  state.stores = seedStores.map(clone);
}
