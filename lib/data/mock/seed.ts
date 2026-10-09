import type { AppNotification, Store, Tenant, AuthUser } from "../types";

/**
 * Realistic seed data for Stage 1 (mock-only). Values echo the UI-UX mockups
 * (Downtown Flagship / Austin, Alex Morgan · Store Admin). Not production data —
 * removed entirely during Stage 3 integration.
 */

export const seedTenant: Tenant = {
  id: "tenant_mozud",
  name: "Mozud Coffee Co.",
  baseCurrency: "USD",
  locale: "en-US",
};

export const seedUser: AuthUser = {
  id: "user_alex",
  fullName: "Alex Morgan",
  email: "alex@mozud.example",
  role: "store_manager",
};

export const seedStores: Store[] = [
  {
    id: "store_downtown",
    name: "Downtown Flagship",
    code: "AUS-01",
    city: "Austin, TX",
    currency: "USD",
    status: "active",
  },
  {
    id: "store_north",
    name: "Austin North",
    code: "AUS-02",
    city: "Austin, TX",
    currency: "USD",
    status: "active",
  },
  {
    id: "store_riverside",
    name: "Riverside Kiosk",
    code: "AUS-03",
    city: "Austin, TX",
    currency: "USD",
    status: "active",
  },
  {
    id: "store_warehouse",
    name: "Central Warehouse",
    code: "WH-01",
    city: "Round Rock, TX",
    currency: "USD",
    status: "inactive",
  },
];

export const seedNotifications: AppNotification[] = [
  {
    id: "ntf_1",
    title: "Low stock: Cold Brew Filter Mesh 50pk",
    body: "SKU CB-012 is critical (0 on hand) at Downtown Flagship.",
    severity: "critical",
    read: false,
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: "ntf_2",
    title: "Reorder draft ready",
    body: "18 SKUs crossed their reorder threshold. A draft PO is ready to review.",
    severity: "warning",
    read: false,
    createdAt: new Date(Date.now() - 42 * 60_000).toISOString(),
  },
  {
    id: "ntf_3",
    title: "Transfer #8821 in transit",
    body: "Austin North → Downtown Flagship, ETA today 3:30 PM.",
    severity: "info",
    read: false,
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  },
  {
    id: "ntf_4",
    title: "Shift reconciled",
    body: "Terminal #01 drawer closed with $0.00 variance.",
    severity: "success",
    read: true,
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  },
];

export const seedActiveStoreId = seedStores[0]!.id;
