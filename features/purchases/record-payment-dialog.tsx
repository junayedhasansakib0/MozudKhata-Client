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
import { Label } from "@/components/ui/label";
import { toUserMessage } from "@/lib/data/errors";
import type { PurchaseOrder } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { usePurchaseMutations } from "./use-purchases";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
}

export function RecordPaymentDialog({ open, onOpenChange, order }: RecordPaymentDialogProps) {
  const { recordPayment } = usePurchaseMutations();
  const dueMinor = order ? order.total.amountMinor - order.amountPaid.amountMinor : 0;
  const [amount, setAmount] = React.useState((dueMinor / 100).toFixed(2));

  const numeric = Number(amount);
  const valid = amount !== "" && Number.isFinite(numeric) && numeric > 0;

  async function submit() {
    if (!order || !valid) return;
    try {
      await recordPayment.mutateAsync({ id: order.id, amountMinor: Math.round(numeric * 100) });
      toast.success(`Payment recorded for ${order.poNumber}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment — {order?.poNumber}</DialogTitle>
          <DialogDescription>
            {order
              ? `Total ${formatMoney(order.total)} · paid ${formatMoney(order.amountPaid)} · due ${formatMoney({ amountMinor: Math.max(0, dueMinor), currency: order.currency })}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="pay-amount" className="text-label-sm uppercase tracking-wide text-muted-foreground">
            Amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="pay-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="pl-7 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || recordPayment.isPending}>
            {recordPayment.isPending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
