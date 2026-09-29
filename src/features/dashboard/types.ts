import type { MovementType } from "@/features/inventory/types";

/** Dashboard types mirroring the server's public shapes (docs/api.md §Phase 07). */

/** One recent-activity entry: a ledger movement joined with its product name. */
export interface DashboardActivity {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  // Signed decimals arrive as strings to preserve precision (docs/api.md §1).
  quantityDelta: string;
  balanceAfter: string;
  reason: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  // Decimal arrives as a string to preserve precision (docs/api.md §1).
  totalStockUnits: string;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCount: number;
  recentActivity: DashboardActivity[];
}
