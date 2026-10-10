import type { Customer, CustomerInput, Id } from "../types";
import { ApiError } from "../errors";

/**
 * In-memory customer directory for Stage 1. Owns customer profiles, loyalty, and
 * house-credit balances. Purchase/payment history is composed from the sales store in
 * the UI layer (no import cycle). Removed in Stage 3. Not production data.
 */

const CURRENCY = "USD";

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function money(minor: number) {
  return { amountMinor: Math.round(minor), currency: CURRENCY };
}

const SEED_CUSTOMERS: Customer[] = [
  {
    id: "c_marcus",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    phone: "+1 512-882-9014",
    loyaltyTier: "VIP Tier 2",
    loyaltyPoints: 340,
    creditLimit: money(50000),
    balance: money(18500),
    status: "active",
    createdAt: new Date(Date.now() - 400 * 86_400_000).toISOString(),
  },
  {
    id: "c_elena",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+1 512-440-1180",
    loyaltyTier: "Member",
    loyaltyPoints: 85,
    creditLimit: money(20000),
    balance: money(0),
    status: "active",
    createdAt: new Date(Date.now() - 220 * 86_400_000).toISOString(),
  },
  {
    id: "c_sarah",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@example.com",
    phone: "+1 737-212-4455",
    loyaltyTier: "Member",
    loyaltyPoints: 42,
    creditLimit: money(0),
    balance: money(0),
    status: "active",
    createdAt: new Date(Date.now() - 120 * 86_400_000).toISOString(),
  },
  {
    id: "c_david",
    name: "David Okafor",
    phone: "+1 512-991-7781",
    loyaltyPoints: 0,
    creditLimit: money(10000),
    balance: money(4200),
    status: "active",
    createdAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
  },
];

const state = { customers: SEED_CUSTOMERS.map(clone) };

export function listCustomers(): Customer[] {
  return state.customers.map(clone);
}

export function getCustomer(id: Id): Customer | null {
  const customer = state.customers.find((c) => c.id === id);
  return customer ? clone(customer) : null;
}

export function createCustomer(input: CustomerInput): Customer {
  if (!input.name.trim()) throw new ApiError("VALIDATION_FAILED", "Customer name is required.", { status: 422 });
  const customer: Customer = {
    id: uid("c"),
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    loyaltyTier: input.loyaltyTier?.trim() || undefined,
    loyaltyPoints: 0,
    creditLimit: money(input.creditLimitMinor ?? 0),
    balance: money(0),
    status: input.status,
    createdAt: nowIso(),
  };
  state.customers.push(customer);
  return clone(customer);
}

export function updateCustomer(id: Id, input: CustomerInput): Customer {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) throw new ApiError("NOT_FOUND", "Customer not found.", { status: 404 });
  customer.name = input.name.trim() || customer.name;
  customer.email = input.email?.trim() || undefined;
  customer.phone = input.phone?.trim() || undefined;
  customer.loyaltyTier = input.loyaltyTier?.trim() || undefined;
  if (input.creditLimitMinor !== undefined) customer.creditLimit = money(input.creditLimitMinor);
  customer.status = input.status;
  return clone(customer);
}

export function setCustomerStatus(id: Id, status: Customer["status"]): Customer {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) throw new ApiError("NOT_FOUND", "Customer not found.", { status: 404 });
  customer.status = status;
  return clone(customer);
}

/** Adjust a customer's house-credit balance (used by refunds to house credit). */
export function adjustCustomerBalance(id: Id, deltaMinor: number): void {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) return;
  customer.balance = money(Math.max(0, customer.balance.amountMinor + deltaMinor));
}

/** Test-only reset. */
export function __resetCustomers(): void {
  state.customers = SEED_CUSTOMERS.map(clone);
}
