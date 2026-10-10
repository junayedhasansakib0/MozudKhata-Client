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
import type { OrderStatus, SaleOrder } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentMethodsSummary } from "./sales-math";

const STATUS_VARIANT: Record<OrderStatus, "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  completed: "success",
  partially_refunded: "warning",
  refunded: "destructive",
  voided: "outline",
  held: "secondary",
};

interface SalesTableProps {
  orders: SaleOrder[];
  onOpen: (order: SaleOrder) => void;
}

export function SalesTable({ orders, onOpen }: SalesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-end">Total</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(order)}
                  className="text-start font-mono text-code-sku font-semibold text-foreground hover:text-primary"
                >
                  {order.orderNumber}
                </button>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
              <TableCell className="text-sm text-foreground">{order.customerName ?? "Walk-in"}</TableCell>
              <TableCell className="text-center tabular-nums text-muted-foreground">
                {order.items.reduce((s, i) => s + i.quantity, 0)}
              </TableCell>
              <TableCell className="text-xs capitalize text-muted-foreground">
                {paymentMethodsSummary(order)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-end font-mono text-code-sku text-foreground">
                {formatMoney(order.total)}
              </TableCell>
              <TableCell className="text-end">
                <Button variant="outline" size="sm" onClick={() => onOpen(order)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
