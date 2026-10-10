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
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { SupervisorPin } from "@/features/pos/supervisor-pin";
import { toUserMessage } from "@/lib/data/errors";
import type { RefundReason, SaleOrder, TenderMethod } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { refundableQty, refundAmountMinor } from "./sales-math";
import { useRefundMutation } from "./use-sales";

const REASONS: { value: RefundReason; label: string }[] = [
  { value: "customer_return", label: "Customer return" },
  { value: "damaged", label: "Damaged / defective" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "price_adjustment", label: "Price adjustment" },
  { value: "other", label: "Other" },
];

const METHODS: { value: TenderMethod | "other"; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "qr_wallet", label: "QR wallet" },
  { value: "house_credit", label: "House credit" },
  { value: "other", label: "Other" },
];

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SaleOrder | null;
}

export function RefundDialog({ open, onOpenChange, order }: RefundDialogProps) {
  const refund = useRefundMutation();
  const [qty, setQty] = React.useState<Record<string, string>>({});
  const [reason, setReason] = React.useState<RefundReason>("customer_return");
  const [method, setMethod] = React.useState<TenderMethod | "other">(
    (order?.payments[0]?.method as TenderMethod | "other") ?? "cash",
  );
  const [restock, setRestock] = React.useState(true);
  const [pin, setPin] = React.useState("");

  const lines = order
    ? order.items
        .map((item) => ({ orderItemId: item.id, quantity: Number(qty[item.id] ?? "0") }))
        .filter((l) => l.quantity > 0)
    : [];
  const amountMinor = order ? refundAmountMinor(order, lines) : 0;
  const canSubmit = Boolean(order) && lines.length > 0 && pin.trim().length > 0 && !refund.isPending;

  async function submit() {
    if (!order || !canSubmit) return;
    try {
      await refund.mutateAsync({ orderId: order.id, lines, reason, method, restock, supervisorPin: pin });
      toast.success(`Refunded ${formatMoney({ amountMinor, currency: order.currency })}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund {order?.orderNumber}</DialogTitle>
          <DialogDescription>Select items and quantities to refund.</DialogDescription>
        </DialogHeader>
        {order ? (
          <div className="space-y-4">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {order.items.map((item) => {
                const max = refundableQty(item);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="font-mono text-code-sku text-muted-foreground">
                        {formatMoney(item.unitPrice)} · {max} refundable
                      </p>
                    </div>
                    <Input
                      value={qty[item.id] ?? "0"}
                      onChange={(e) => setQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      disabled={max === 0}
                      className="w-20 font-mono"
                      aria-label={`Refund quantity for ${item.sku}`}
                    />
                  </li>
                );
              })}
            </ul>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Reason</Label>
                <NativeSelect value={reason} onChange={(e) => setReason(e.target.value as RefundReason)}>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Method</Label>
                <NativeSelect value={method} onChange={(e) => setMethod(e.target.value as TenderMethod | "other")}>
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="font-medium text-foreground">Restock returned items</span>
              <Switch checked={restock} onCheckedChange={setRestock} aria-label="Restock returned items" />
            </label>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-sm text-muted-foreground">Refund amount</span>
              <span className="font-display text-headline-sm font-bold tabular-nums text-foreground">
                {formatMoney({ amountMinor, currency: order.currency })}
              </span>
            </div>

            <SupervisorPin value={pin} onChange={setPin} reason="A refund" />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={refund.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {refund.isPending ? "Processing…" : "Process refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
