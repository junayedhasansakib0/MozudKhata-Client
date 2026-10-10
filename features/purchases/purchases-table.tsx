"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PurchaseOrder, PurchasePaymentStatus, PurchaseStatus } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { receivedProgress } from "./purchasing-math";

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

interface PurchasesTableProps {
  orders: PurchaseOrder[];
  onOpen: (order: PurchaseOrder) => void;
  onReceive: (order: PurchaseOrder) => void;
}

export function PurchasesTable({ orders, onOpen, onReceive }: PurchasesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>PO</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-end">Total</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const progress = receivedProgress(order.items);
            const canReceive = order.status === "ordered" || order.status === "partially_received";
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onOpen(order)}
                    className="text-start font-mono text-code-sku font-semibold text-foreground hover:text-primary"
                  >
                    {order.poNumber}
                  </button>
                  <span className="block text-[11px] text-muted-foreground">
                    {progress.received}/{progress.ordered} received
                  </span>
                </TableCell>
                <TableCell className="text-sm text-foreground">{order.supplierName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.storeName}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={PAYMENT_VARIANT[order.paymentStatus]}>{order.paymentStatus}</Badge>
                </TableCell>
                <TableCell className="text-end font-mono text-code-sku text-foreground">
                  {formatMoney(order.total)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {order.expectedAt ? formatDate(order.expectedAt) : "—"}
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1.5">
                    {canReceive ? (
                      <Button size="sm" onClick={() => onReceive(order)}>
                        Receive
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => onOpen(order)}>
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
