"use client";

import { toast } from "sonner";
import { Ban, PackageCheck, Send, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toUserMessage } from "@/lib/data/errors";
import type { PurchaseOrder, PurchasePaymentStatus, PurchaseStatus } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { usePurchaseMutations } from "./use-purchases";

const STATUS_VARIANT: Record<PurchaseStatus, "secondary" | "info" | "warning" | "success" | "outline"> = {
  draft: "secondary",
  ordered: "info",
  partially_received: "warning",
  received: "success",
  cancelled: "outline",
};

const PAYMENT_VARIANT: Record<PurchasePaymentStatus, "secondary" | "warning" | "success"> = {
  unpaid: "secondary",
  partial: "warning",
  paid: "success",
};

interface PoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  onReceive: (order: PurchaseOrder) => void;
  onRecordPayment: (order: PurchaseOrder) => void;
}

export function PoDetailSheet({ open, onOpenChange, order, onReceive, onRecordPayment }: PoDetailSheetProps) {
  const { submit, cancel } = usePurchaseMutations();

  async function doSubmit() {
    if (!order) return;
    try {
      await submit.mutateAsync(order.id);
      toast.success(`${order.poNumber} marked as ordered`);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function doCancel() {
    if (!order) return;
    try {
      await cancel.mutateAsync(order.id);
      toast.success(`${order.poNumber} cancelled`);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const canReceive = order?.status === "ordered" || order?.status === "partially_received";
  const canPay =
    order !== null && order.status !== "cancelled" && order.amountPaid.amountMinor < order.total.amountMinor;
  const canCancel =
    order?.status === "draft" || order?.status === "ordered" || order?.status === "partially_received";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {order ? (
          <>
            <SheetHeader className="border-b border-border bg-muted/40 p-5 text-left">
              <SheetTitle>{order.poNumber}</SheetTitle>
              <SheetDescription>
                {order.supplierName} · {order.storeName}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
                <Badge variant={PAYMENT_VARIANT[order.paymentStatus]}>{order.paymentStatus}</Badge>
                {order.expectedAt ? (
                  <span className="text-label-sm text-muted-foreground">
                    Expected {formatDate(order.expectedAt)}
                  </span>
                ) : null}
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Ordered</TableHead>
                      <TableHead className="text-center">Received</TableHead>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.variantId}>
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">{item.productName}</span>
                          <span className="block font-mono text-code-sku text-muted-foreground">{item.sku}</span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantityOrdered}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          <span
                            className={
                              item.quantityReceived >= item.quantityOrdered
                                ? "text-success"
                                : item.quantityReceived > 0
                                  ? "text-warning"
                                  : "text-muted-foreground"
                            }
                          >
                            {item.quantityReceived}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-code-sku text-muted-foreground">
                          {formatMoney(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-code-sku text-foreground">
                          {formatMoney(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                <Row label="Tax" value={formatMoney(order.taxTotal)} />
                <Row label="Total" value={formatMoney(order.total)} strong />
                <Row label="Paid" value={formatMoney(order.amountPaid)} />
              </dl>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-4">
              {canCancel ? (
                <Button variant="ghost" onClick={doCancel} disabled={cancel.isPending}>
                  <Ban className="size-4" />
                  Cancel
                </Button>
              ) : null}
              {order.status === "draft" ? (
                <Button variant="outline" onClick={doSubmit} disabled={submit.isPending}>
                  <Send className="size-4" />
                  Mark ordered
                </Button>
              ) : null}
              {canPay ? (
                <Button variant="outline" onClick={() => onRecordPayment(order)}>
                  <Wallet className="size-4" />
                  Record payment
                </Button>
              ) : null}
              {canReceive ? (
                <Button onClick={() => onReceive(order)}>
                  <PackageCheck className="size-4" />
                  Receive stock
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-display text-headline-sm font-bold tabular-nums text-foreground" : "font-mono text-code-sku text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
