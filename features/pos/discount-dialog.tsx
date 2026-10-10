"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requiresOverride, type OrderDiscount } from "./cart-math";
import { SupervisorPin } from "./supervisor-pin";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotalMinor: number;
  current: OrderDiscount;
  onApply: (discount: OrderDiscount) => void;
}

export function DiscountDialog({
  open,
  onOpenChange,
  subtotalMinor,
  current,
  onApply,
}: DiscountDialogProps) {
  const [mode, setMode] = React.useState<"pct" | "flat">(current.kind === "flat" ? "flat" : "pct");
  const [value, setValue] = React.useState(
    current.kind === "none"
      ? ""
      : String(current.kind === "flat" ? current.value / 100 : current.value),
  );
  const [pin, setPin] = React.useState("");

  const num = Number(value);
  const discount: OrderDiscount =
    value === "" || Number.isNaN(num) || num <= 0
      ? { kind: "none" }
      : mode === "pct"
        ? { kind: "pct", value: num }
        : { kind: "flat", value: Math.round(num * 100) };

  const needsOverride = requiresOverride(discount, subtotalMinor);
  const canApply = discount.kind === "none" ? true : !needsOverride || pin.trim().length >= 4;
  const previewAmount =
    discount.kind === "pct"
      ? Math.round(subtotalMinor * (num / 100))
      : discount.kind === "flat"
        ? Math.min(Math.round(num * 100), subtotalMinor)
        : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order discount</DialogTitle>
          <DialogDescription className="sr-only">
            Apply a percentage or flat discount to the order subtotal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(["pct", "flat"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-sm font-medium",
                  mode === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "pct" ? "Percentage" : "Flat amount"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={mode === "pct" ? "e.g. 10" : "e.g. 5.00"}
              aria-label={mode === "pct" ? "Discount percentage" : "Discount amount"}
            />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground">
              {mode === "pct" ? "%" : "USD"}
            </span>
          </div>
          {previewAmount > 0 ? (
            <p className="text-sm text-muted-foreground">
              Discount:{" "}
              <span className="font-medium text-foreground">
                −{formatMoney({ amountMinor: previewAmount, currency: "USD" })}
              </span>
            </p>
          ) : null}
          {needsOverride ? (
            <SupervisorPin value={pin} onChange={setPin} reason="A discount over 20%" />
          ) : null}
        </div>
        <DialogFooter>
          {current.kind !== "none" ? (
            <Button
              variant="ghost"
              onClick={() => {
                onApply({ kind: "none" });
                onOpenChange(false);
              }}
            >
              Remove discount
            </Button>
          ) : null}
          <Button
            disabled={!canApply}
            onClick={() => {
              onApply(discount);
              onOpenChange(false);
            }}
          >
            Apply discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
