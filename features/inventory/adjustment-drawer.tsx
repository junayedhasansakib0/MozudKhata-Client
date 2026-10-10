"use client";

import * as React from "react";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { SupervisorPin } from "@/features/pos/supervisor-pin";
import { toUserMessage } from "@/lib/data/errors";
import type { AdjustmentReason, AdjustmentType, InventoryItem } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { adjustmentNewBalance } from "./inventory-math";
import { useInventoryMutations } from "./use-inventory";

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "recount", label: "Cycle count / recount" },
  { value: "damaged", label: "Damaged / spoilage" },
  { value: "theft", label: "Theft / shrinkage" },
  { value: "received", label: "Received / found stock" },
  { value: "promo", label: "Promo / sample" },
  { value: "other", label: "Other" },
];

const TYPES: { value: AdjustmentType; label: string }[] = [
  { value: "add", label: "+ Add" },
  { value: "remove", label: "− Remove" },
  { value: "exact", label: "= Exact count" },
];

interface AdjustmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function AdjustmentDrawer({ open, onOpenChange, item }: AdjustmentDrawerProps) {
  const { adjust } = useInventoryMutations();
  const [type, setType] = React.useState<AdjustmentType>("add");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState<AdjustmentReason>("recount");
  const [note, setNote] = React.useState("");
  const [pin, setPin] = React.useState("");

  const qty = Number(quantity);
  const validQty = quantity !== "" && Number.isFinite(qty) && qty >= 0;
  const newBalance =
    item && validQty ? adjustmentNewBalance(type, item.onHand, qty) : (item?.onHand ?? 0);
  const delta = item ? newBalance - item.onHand : 0;
  const canSubmit = Boolean(item) && validQty && pin.trim().length > 0 && !adjust.isPending;

  async function submit() {
    if (!item || !canSubmit) return;
    try {
      await adjust.mutateAsync({
        variantId: item.variantId,
        storeId: item.storeId,
        type,
        quantity: qty,
        reason,
        note,
        supervisorPin: pin,
      });
      toast.success(`Stock adjusted — ${item.productName} now ${newBalance} ${item.unit}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border bg-muted/40 p-5 text-start">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <SheetTitle>Stock adjustment</SheetTitle>
              <SheetDescription>
                {item ? `${item.productName} · ${item.sku} · ${item.storeName}` : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {item ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Current on-hand</span>
              <span className="font-semibold tabular-nums text-foreground">
                {item.onHand} {item.unit}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                id="adj-type-label"
                className="text-label-sm uppercase tracking-wide text-muted-foreground"
              >
                Adjustment type
              </Label>
              <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="adj-type-label">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                      type === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="adj-qty"
                className="text-label-sm uppercase tracking-wide text-muted-foreground"
              >
                {type === "exact" ? "Counted quantity" : "Quantity"}
              </Label>
              <Input
                id="adj-qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="font-mono"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="text-muted-foreground">New on-hand</span>
              <span className="font-semibold tabular-nums text-foreground">
                {newBalance} {item.unit}
                <span
                  className={cn(
                    "ms-2 text-xs",
                    delta > 0
                      ? "text-success"
                      : delta < 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  ({delta >= 0 ? "+" : ""}
                  {delta})
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="adj-reason"
                className="text-label-sm uppercase tracking-wide text-muted-foreground"
              >
                Reason code
              </Label>
              <NativeSelect
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="adj-note"
                className="text-label-sm uppercase tracking-wide text-muted-foreground"
              >
                Audit note
              </Label>
              <Textarea
                id="adj-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Context for the audit log (optional)."
                className="min-h-[64px]"
              />
            </div>

            <SupervisorPin value={pin} onChange={setPin} reason="A stock adjustment" />
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {adjust.isPending ? "Applying…" : "Apply adjustment"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
