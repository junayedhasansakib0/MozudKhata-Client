"use client";

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
import type { SaleOrder } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SaleOrder | null;
}

export function InvoiceDialog({ open, onOpenChange, order }: InvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invoice {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            {order
              ? `${order.storeName} · ${formatDate(order.createdAt, undefined, { dateStyle: "medium", timeStyle: "short" })}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {order ? (
          <div className="text-code-sku space-y-4 rounded-lg border border-border bg-card p-4 font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Cashier: {order.cashierName}</span>
              <span>{order.customerName ?? "Walk-in"}</span>
            </div>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-foreground">{formatMoney(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-dashed border-border pt-2 text-muted-foreground">
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {order.discountTotal.amountMinor > 0 ? (
                <Row label="Discount" value={`−${formatMoney(order.discountTotal)}`} />
              ) : null}
              <Row label="Tax" value={formatMoney(order.taxTotal)} />
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
              {order.refundedTotal.amountMinor > 0 ? (
                <Row label="Refunded" value={`−${formatMoney(order.refundedTotal)}`} />
              ) : null}
            </div>
            <div className="space-y-1 border-t border-dashed border-border pt-2 text-muted-foreground">
              {order.payments.map((p) => (
                <Row key={p.id} label={p.method.replace("_", " ")} value={formatMoney(p.amount)} />
              ))}
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() =>
              toast.success(
                `Invoice ${order?.orderNumber} prepared — printing is a prototype preview`,
              )
            }
          >
            Print / send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between capitalize">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
