"use client";

import * as React from "react";
import { toast } from "sonner";

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
import { toUserMessage } from "@/lib/data/errors";
import type { PurchaseOrder } from "@/lib/data/types";
import { usePurchaseMutations } from "./use-purchases";

interface ReceivePoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
}

export function ReceivePoDialog({ open, onOpenChange, order }: ReceivePoDialogProps) {
  const { receive } = usePurchaseMutations();
  const [received, setReceived] = React.useState<Record<string, string>>({});

  function remaining(variantId: string, ordered: number, already: number): string {
    return received[variantId] ?? String(Math.max(0, ordered - already));
  }

  async function submit() {
    if (!order) return;
    try {
      await receive.mutateAsync({
        id: order.id,
        lines: order.items.map((item) => ({
          variantId: item.variantId,
          quantityReceived: Number(remaining(item.variantId, item.quantityOrdered, item.quantityReceived)),
        })),
      });
      toast.success(`Received stock for ${order.poNumber}`);
      setReceived({});
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive stock — {order?.poNumber}</DialogTitle>
          <DialogDescription>
            Enter quantities received now. Partial receipts accumulate; stock increases on receipt.
          </DialogDescription>
        </DialogHeader>
        {order ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {order.items.map((item) => {
              const left = Math.max(0, item.quantityOrdered - item.quantityReceived);
              return (
                <li key={item.variantId} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.productName}</p>
                    <p className="font-mono text-code-sku text-muted-foreground">
                      {item.sku} · {item.quantityReceived}/{item.quantityOrdered} received · {left} left
                    </p>
                  </div>
                  <Input
                    value={remaining(item.variantId, item.quantityOrdered, item.quantityReceived)}
                    onChange={(e) => setReceived((prev) => ({ ...prev, [item.variantId]: e.target.value }))}
                    inputMode="numeric"
                    className="w-24 font-mono"
                    aria-label={`Receive quantity for ${item.sku}`}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={receive.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={receive.isPending}>
            {receive.isPending ? "Receiving…" : "Confirm receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
