import { Badge } from "@/components/ui/badge";
import type { MovementType } from "../types";

/** Maps a movement type to a labelled, colour-coded badge (docs/api.md §Phase 05). */
const TYPE: Record<
  MovementType,
  { label: string; variant: "success" | "warning" | "destructive" | "muted" }
> = {
  IN: { label: "In", variant: "success" },
  OUT: { label: "Out", variant: "warning" },
  ADJUSTMENT: { label: "Adjustment", variant: "muted" },
  DAMAGED_LOST: { label: "Damaged / lost", variant: "destructive" },
};

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const { label, variant } = TYPE[type];
  return <Badge variant={variant}>{label}</Badge>;
}
