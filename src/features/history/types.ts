/** Global stock-movement history types (docs/api.md §Phase 08). */

import type { MovementType, PageMeta } from "@/features/inventory/types";

/**
 * A ledger movement enriched with its product's current name — the row shape the
 * global history endpoint returns so each entry is readable without a lookup.
 * Decimals arrive as strings to preserve precision (docs/api.md §1).
 */
export interface MovementRecord {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityDelta: string;
  balanceAfter: string;
  reason: string | null;
  actorId: string;
  createdAt: string;
}

/** Global history query params (all optional + combinable, applied server-side). */
export interface MovementListParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: MovementType;
  /** ISO-8601 lower bound (inclusive) on `createdAt`. */
  from?: string;
  /** ISO-8601 upper bound (inclusive) on `createdAt`. */
  to?: string;
}

export interface MovementPage {
  movements: MovementRecord[];
  meta: PageMeta;
}
