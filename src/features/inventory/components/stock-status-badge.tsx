import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "../types";

/** Maps a derived stock status to a labelled, colour-coded badge. */
const STATUS: Record<StockStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  IN_STOCK: { label: "In stock", variant: "success" },
  LOW: { label: "Low", variant: "warning" },
  OUT: { label: "Out of stock", variant: "destructive" },
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
