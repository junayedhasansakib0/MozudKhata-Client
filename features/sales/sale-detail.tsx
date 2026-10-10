"use client";

import { Receipt, RotateCcw } from "lucide-react";

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
import type { OrderStatus, SaleOrder } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentMethodsSummary, refundableQty } from "./sales-math";

const STATUS_VARIANT: Record<OrderStatus, "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  completed: "success",
  partially_refunded: "warning",
  refunded: "destructive",
  voided: "outline",
  held: "secondary",
};

interface SaleDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SaleOrder | null;
  onInvoice: (order: SaleOrder) => void;
  onRefund: (order: SaleOrder) => void;
}

export function SaleDetailSheet({ open, onOpenChange, order, onInvoice, onRefund }: SaleDetailSheetProps) {
  const canRefund =
    order !== null &&
    order.status !== "voided" &&
    order.status !== "refunded" &&
    order.items.some((i) => refundableQty(i) > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {order ? (
          <>
            <SheetHeader className="border-b border-border bg-muted/40 p-5 text-left">
              <SheetTitle>{order.orderNumber}</SheetTitle>
              <SheetDescription>
                {order.storeName} · {order.customerName ?? "Walk-in"} ·{" "}
                {formatDate(order.createdAt, undefined, { dateStyle: "medium", timeStyle: "short" })}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
                <span className="text-label-sm capitalize text-muted-foreground">
                  {paymentMethodsSummary(order)}
                </span>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="block font-mono text-code-sku text-muted-foreground">
                            {item.sku}
                            {item.quantityRefunded > 0 ? ` · ${item.quantityRefunded} refunded` : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-code-sku text-muted-foreground">
                          {formatMoney(item.unitPrice)}
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
                {order.refundedTotal.amountMinor > 0 ? (
                  <Row label="Refunded" value={`−${formatMoney(order.refundedTotal)}`} />
                ) : null}
              </dl>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 p-4">
              <Button variant="outline" onClick={() => onInvoice(order)}>
                <Receipt className="size-4" />
                Invoice
              </Button>
              {canRefund ? (
                <Button onClick={() => onRefund(order)}>
                  <RotateCcw className="size-4" />
                  Refund
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
