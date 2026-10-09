"use client";

import { Ban, DollarSign, Printer, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  count: number;
  onUpdatePrice: () => void;
  onChangeCategory: () => void;
  onPrintLabels: () => void;
  onDeactivate: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  count,
  onUpdatePrice,
  onChangeCategory,
  onPrintLabels,
  onDeactivate,
  onClear,
}: BulkActionsBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {count} {count === 1 ? "product" : "products"} selected
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onUpdatePrice}>
          <DollarSign className="size-4 text-primary" />
          Update price
        </Button>
        <Button variant="outline" size="sm" onClick={onChangeCategory}>
          <Tag className="size-4" />
          Change category
        </Button>
        <Button variant="outline" size="sm" onClick={onPrintLabels}>
          <Printer className="size-4" />
          Print labels
        </Button>
        <Button variant="outline" size="sm" onClick={onDeactivate}>
          <Ban className="size-4 text-destructive" />
          Deactivate
        </Button>
        <Button variant="ghost" size="icon" onClick={onClear} title="Clear selection" aria-label="Clear selection">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
