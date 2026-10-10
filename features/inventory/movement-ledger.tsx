"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ScrollText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockMovementType } from "@/lib/data/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMovements } from "./use-inventory";

const TYPE_LABEL: Record<StockMovementType, string> = {
  sale: "Sale",
  sale_return: "Return",
  purchase_receipt: "Purchase receipt",
  adjustment: "Adjustment",
  transfer_out: "Transfer out",
  transfer_in: "Transfer in",
  initial: "Initial",
};

interface MovementLedgerProps {
  storeId: string;
}

export function MovementLedger({ storeId }: MovementLedgerProps) {
  const [type, setType] = React.useState<StockMovementType | "all">("all");
  const movementsQuery = useMovements({ storeId, type });
  const movements = movementsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NativeSelect
          value={type}
          onChange={(e) => setType(e.target.value as StockMovementType | "all")}
          aria-label="Filter movement type"
          className="w-auto"
        >
          <option value="all">All movement types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {movementsQuery.isError ? (
        <ErrorState error={movementsQuery.error} onRetry={() => movementsQuery.refetch()} />
      ) : movementsQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : movements.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No stock movements"
          description="Adjustments, transfers, and sales will appear in this ledger."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>When</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-end">Change</TableHead>
                <TableHead className="text-end">Balance</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatRelativeTime(movement.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">
                      {movement.productName}
                    </span>
                    <span className="text-code-sku block font-mono text-muted-foreground">
                      {movement.sku}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABEL[movement.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {movement.reasonCode ?? "—"}
                    {movement.note ? <span className="block italic">{movement.note}</span> : null}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-code-sku text-end font-mono font-semibold",
                      movement.quantityDelta > 0
                        ? "text-success"
                        : movement.quantityDelta < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {movement.quantityDelta >= 0 ? "+" : ""}
                    {movement.quantityDelta}
                  </TableCell>
                  <TableCell className="text-code-sku text-end font-mono tabular-nums text-foreground">
                    {movement.balanceAfter}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{movement.actor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
