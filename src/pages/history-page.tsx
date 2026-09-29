import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementTypeBadge } from "@/features/inventory/components/movement-type-badge";
import { useProducts } from "@/features/inventory/hooks";
import type { MovementType } from "@/features/inventory/types";
import { useOwnerMovements } from "@/features/history/hooks";

const PAGE_SIZE = 20;

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "IN", label: "In" },
  { value: "OUT", label: "Out" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "DAMAGED_LOST", label: "Damaged / lost" },
];

/** Formats a signed decimal string with an explicit leading sign. */
function formatDelta(delta: string): string {
  return delta.startsWith("-") ? delta : `+${delta}`;
}

// A calendar date bounds the inclusive UTC range: `from` at start-of-day, `to` at
// end-of-day, so both endpoints select the whole chosen day (server coerces ISO).
function startOfDayIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}
function endOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<MovementType | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Any filter change resets to the first page so results stay coherent.
  useEffect(() => {
    setPage(1);
  }, [productId, type, from, to]);

  // Populate the product filter; one big page is plenty for a Select.
  const { data: productData } = useProducts({
    page: 1,
    pageSize: 100,
    sort: "name",
    order: "asc",
  });
  const products = productData?.products ?? [];

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      productId: productId || undefined,
      type: type || undefined,
      from: from ? startOfDayIso(from) : undefined,
      to: to ? endOfDayIso(to) : undefined,
    }),
    [page, productId, type, from, to],
  );

  const { data, isLoading, isError, error } = useOwnerMovements(params);

  const meta = data?.meta;
  const movements = data?.movements ?? [];
  const hasFilters = Boolean(productId || type || from || to);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-muted-foreground">Every stock movement across your inventory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="history-product">Product</Label>
          <Select
            id="history-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-type">Type</Label>
          <Select
            id="history-type"
            value={type}
            onChange={(e) => setType(e.target.value as MovementType | "")}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-from">From</Label>
          <Input
            id="history-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-to">To</Label>
          <Input
            id="history-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* PLACEHOLDER_TABLE */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load movement history."}
        </p>
      ) : movements.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "No movements match these filters."
              : "No stock movements recorded yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
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
                    <Link
                      to={`/products/${m.productId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {m.productName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <MovementTypeBadge type={m.type} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDelta(m.quantityDelta)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.balanceAfter}</TableCell>
                  <TableCell className="text-muted-foreground">{m.reason ?? "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} movements
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
