"use client";

import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states/empty-state";
import { Boxes } from "lucide-react";
import type { InventoryItem, Money, StockLevelKey } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";

function money(minor: number, currency: string): string {
  return formatMoney({ amountMinor: minor, currency } satisfies Money);
}

function LevelBadge({ level }: { level: StockLevelKey }) {
  if (level === "out") return <Badge variant="destructive">Out of stock</Badge>;
  if (level === "low") return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">Optimal</Badge>;
}

interface StockTableProps {
  items: InventoryItem[];
  onAdjust: (item: InventoryItem) => void;
}

export function StockTable({ items, onAdjust }: StockTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="No stock records match"
        description="Try a different search or stock-status filter."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="min-w-[240px]">Product &amp; SKU</TableHead>
            <TableHead className="text-right">On-hand</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Cost / retail</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
            <TableHead className="text-center">Reorder</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const currency = item.sellPrice.currency;
            return (
              <TableRow key={`${item.variantId}-${item.storeId}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{item.productName}</span>
                    <span className="flex items-center gap-1.5 font-mono text-code-sku text-muted-foreground">
                      {item.sku}
                      {item.variantName !== "Default" ? (
                        <span className="text-[11px]">· {item.variantName}</span>
                      ) : null}
                      {item.binLocation ? <span className="text-[11px]">· {item.binLocation}</span> : null}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold tabular-nums text-foreground">{item.onHand}</span>{" "}
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-code-sku text-muted-foreground">
                  {item.reserved}
                </TableCell>
                <TableCell className="text-right font-mono text-code-sku font-semibold text-primary">
                  {item.available}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-code-sku text-foreground">
                      {money(item.costPrice.amountMinor, currency)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {money(item.sellPrice.amountMinor, currency)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-code-sku font-semibold text-foreground">
                  {money(item.onHand * item.costPrice.amountMinor, currency)}
                </TableCell>
                <TableCell className="text-center font-mono text-code-sku text-muted-foreground">
                  {item.reorderThreshold}
                </TableCell>
                <TableCell>
                  <LevelBadge level={item.level} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onAdjust(item)}>
                    <SlidersHorizontal className="size-4" />
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
