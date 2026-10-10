import type { AppNotification, Id } from "../types";
import { seedNotifications } from "./seed";

/** Mutable notifications store for Stage 1 (read/unread). Removed in Stage 3. */

function clone<T>(value: T): T {
  return structuredClone(value);
}

const state = { items: seedNotifications.map(clone) };

export function listNotifications(): AppNotification[] {
  return state.items.map(clone);
}

export function unreadNotificationCount(): number {
  return state.items.filter((n) => !n.read).length;
}

export function markNotificationRead(id: Id): void {
  const item = state.items.find((n) => n.id === id);
  if (item) item.read = true;
}

export function markAllNotificationsRead(): void {
  for (const item of state.items) item.read = true;
}

export function __resetNotifications(): void {
  state.items = seedNotifications.map(clone);
}
