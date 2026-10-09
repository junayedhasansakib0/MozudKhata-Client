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
import type { StockTransfer } from "@/lib/data/types";
import { useInventoryMutations } from "./use-inventory";

interface ReceiveTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: StockTransfer | null;
}

export function ReceiveTransferDialog({ open, onOpenChange, transfer }: ReceiveTransferDialogProps) {
  const { receive } = useInventoryMutations();
  const [received, setReceived] = React.useState<Record<string, string>>({});

  function qtyFor(variantId: string, shipped: number): string {
    return received[variantId] ?? String(shipped);
  }

  async function submit() {
    if (!transfer) return;
    try {
      await receive.mutateAsync({
        id: transfer.id,
        received: transfer.items.map((item) => ({
          variantId: item.variantId,
          quantityReceived: Number(qtyFor(item.variantId, item.quantity)),
        })),
      });
      toast.success(`Received transfer ${transfer.reference}`);
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
          <DialogTitle>Receive transfer {transfer?.reference}</DialogTitle>
          <DialogDescription>
            Confirm received quantities. Shortages or overages are flagged as a discrepancy.
          </DialogDescription>
        </DialogHeader>
        {transfer ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {transfer.items.map((item) => (
              <li key={item.variantId} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="font-mono text-code-sku text-muted-foreground">
                    {item.sku} · shipped {item.quantity}
                  </p>
                </div>
                <Input
                  value={qtyFor(item.variantId, item.quantity)}
                  onChange={(e) => setReceived((prev) => ({ ...prev, [item.variantId]: e.target.value }))}
                  inputMode="numeric"
                  className="w-24 font-mono"
                  aria-label={`Received quantity for ${item.sku}`}
                />
              </li>
            ))}
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
