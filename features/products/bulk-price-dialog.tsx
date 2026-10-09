"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { BulkPriceAdjustment, BulkPriceMode } from "@/lib/data/types";

interface BulkPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  pending: boolean;
  onApply: (adjustment: BulkPriceAdjustment) => void;
}

const MODES: { value: BulkPriceMode; label: string; unit: "pct" | "amount" }[] = [
  { value: "increase_pct", label: "Increase by %", unit: "pct" },
  { value: "decrease_pct", label: "Decrease by %", unit: "pct" },
  { value: "increase_amount", label: "Increase by amount", unit: "amount" },
  { value: "decrease_amount", label: "Decrease by amount", unit: "amount" },
  { value: "set", label: "Set to amount", unit: "amount" },
];

export function BulkPriceDialog({ open, onOpenChange, count, pending, onApply }: BulkPriceDialogProps) {
  const [target, setTarget] = React.useState<"sell" | "cost">("sell");
  const [mode, setMode] = React.useState<BulkPriceMode>("increase_pct");
  const [value, setValue] = React.useState("");

  const unit = MODES.find((m) => m.value === mode)?.unit ?? "pct";
  const numeric = Number(value);
  const valid = value !== "" && Number.isFinite(numeric) && numeric >= 0;

  function apply() {
    if (!valid) return;
    onApply({
      target,
      mode,
      value: unit === "amount" ? Math.round(numeric * 100) : numeric,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update price</DialogTitle>
          <DialogDescription>
            Applies to every variant of {count} selected {count === 1 ? "product" : "products"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Price</Label>
            <NativeSelect value={target} onChange={(e) => setTarget(e.target.value as "sell" | "cost")}>
              <option value="sell">Sell price</option>
              <option value="cost">Cost price</option>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Operation</Label>
            <NativeSelect value={mode} onChange={(e) => setMode(e.target.value as BulkPriceMode)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bulk-price-value" className="text-label-sm uppercase tracking-wide text-muted-foreground">
            {unit === "pct" ? "Percent" : "Amount"}
          </Label>
          <Input
            id="bulk-price-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder={unit === "pct" ? "e.g. 10" : "e.g. 2.50"}
            className="font-mono"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={!valid || pending}>
            {pending ? "Applying…" : "Apply to selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
