"use client";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { CustomerListItem, OrderStatus } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { useCustomerOrders } from "./use-customers";

const STATUS_VARIANT: Record<OrderStatus, "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  completed: "success",
  partially_refunded: "warning",
  refunded: "destructive",
  voided: "outline",
  held: "secondary",
};

interface CustomerDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerListItem | null;
  onEdit: (customer: CustomerListItem) => void;
}

export function CustomerDetailSheet({ open, onOpenChange, customer, onEdit }: CustomerDetailSheetProps) {
  const ordersQuery = useCustomerOrders(open && customer ? customer.id : null);
  const orders = ordersQuery.data ?? [];
  const payments = orders.flatMap((o) =>
    o.payments.map((p) => ({ ...p, orderNumber: o.orderNumber })),
  );
  const available = customer
    ? customer.creditLimit.amountMinor - customer.balance.amountMinor
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {customer ? (
          <>
            <SheetHeader className="border-b border-border bg-muted/40 p-5 text-start">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <SheetTitle>{customer.name}</SheetTitle>
                  <SheetDescription>{customer.email ?? customer.phone ?? "No contact"}</SheetDescription>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={customer.status === "active" ? "success" : "secondary"}>
                      {customer.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    {customer.loyaltyTier ? <Badge variant="info">{customer.loyaltyTier}</Badge> : null}
                    <span className="text-label-sm text-muted-foreground">
                      {customer.loyaltyPoints} pts
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => onEdit(customer)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Credit limit" value={formatMoney(customer.creditLimit)} />
                <Stat label="Balance" value={formatMoney(customer.balance)} tone={customer.balance.amountMinor > 0 ? "warning" : "muted"} />
                <Stat label="Available" value={formatMoney({ amountMinor: Math.max(0, available), currency: customer.creditLimit.currency })} />
              </div>

              <section>
                <h3 className="mb-2 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Purchase history
                </h3>
                {ordersQuery.isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>Order</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-end">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-code-sku font-semibold text-foreground">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_VARIANT[order.status]}>
                                {order.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end font-mono text-code-sku text-foreground">
                              {formatMoney(order.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment history
                </h3>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {payments.map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                        <span className="text-muted-foreground">
                          {payment.orderNumber} · <span className="capitalize">{payment.method.replace("_", " ")}</span>
                        </span>
                        <span className="font-mono text-code-sku text-foreground">{formatMoney(payment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "warning" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-label-sm uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-display text-headline-sm font-bold tabular-nums ${tone === "warning" ? "text-warning" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
