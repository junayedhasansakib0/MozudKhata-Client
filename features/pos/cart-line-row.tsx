"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { CartLine } from "./cart-store";

interface CartLineRowProps {
  line: CartLine;
  onQty: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineRow({ line, onQty, onRemove }: CartLineRowProps) {
  const money = (amountMinor: number) => formatMoney({ amountMinor, currency: "USD" });
  return (
    <div className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{line.name}</p>
        <p className="text-xs text-muted-foreground">
          {money(line.unitPriceMinor)} · <span className="font-mono">{line.sku}</span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${line.name}`}
          onClick={() => onQty(line.quantity - 1)}
          className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-7 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
        <button
          type="button"
          aria-label={`Increase ${line.name}`}
          onClick={() => onQty(line.quantity + 1)}
          disabled={line.quantity >= line.stock}
          className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="w-16 text-right text-sm font-semibold tabular-nums text-foreground">
        {money(line.unitPriceMinor * line.quantity)}
      </div>
      <button
        type="button"
        aria-label={`Remove ${line.name}`}
        onClick={onRemove}
        className="text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
