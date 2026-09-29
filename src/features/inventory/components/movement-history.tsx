import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductMovements } from "../hooks";
import type { Product } from "../types";
import { MovementTypeBadge } from "./movement-type-badge";

/** Formats a signed decimal string with an explicit leading sign. */
function formatDelta(delta: string): string {
  return delta.startsWith("-") ? delta : `+${delta}`;
}

/** Per-product stock movement history, newest first (docs/api.md §Phase 05). */
export function MovementHistory({ product }: { product: Product }) {
  const { data: movements, isLoading, isError, error } = useProductMovements(product.id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load movement history."}
      </p>
    );
  }

  if (!movements || movements.length === 0) {
    return <p className="text-sm text-muted-foreground">No movements recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <MovementTypeBadge type={m.type} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDelta(m.quantityDelta)} {product.unit}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {m.balanceAfter} {product.unit}
            </TableCell>
            <TableCell className="text-muted-foreground">{m.reason ?? "—"}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {new Date(m.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
