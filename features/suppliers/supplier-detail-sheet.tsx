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
import type { PurchaseStatus, SupplierListItem } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { useSupplierHistory } from "./use-suppliers";

const STATUS_VARIANT: Record<
  PurchaseStatus,
  "secondary" | "info" | "warning" | "success" | "outline"
> = {
  draft: "secondary",
  ordered: "info",
  partially_received: "warning",
  received: "success",
  cancelled: "outline",
};

interface SupplierDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierListItem | null;
  onEdit: (supplier: SupplierListItem) => void;
}

export function SupplierDetailSheet({
  open,
  onOpenChange,
  supplier,
  onEdit,
}: SupplierDetailSheetProps) {
  const historyQuery = useSupplierHistory(open && supplier ? supplier.id : null);
  const history = historyQuery.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {supplier ? (
          <>
            <SheetHeader className="border-b border-border bg-muted/40 p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <SheetTitle>{supplier.name}</SheetTitle>
                  <SheetDescription>
                    {supplier.contactName ? `${supplier.contactName} · ` : ""}
                    {supplier.email ?? supplier.phone ?? "No contact"}
                  </SheetDescription>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant={supplier.status === "active" ? "success" : "secondary"}>
                      {supplier.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-label-sm text-muted-foreground">
                      Outstanding:{" "}
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatMoney(supplier.outstanding)}
                      </span>
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => onEdit(supplier)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h3 className="text-label-sm mb-2 font-semibold uppercase tracking-wider text-muted-foreground">
                Purchase history
              </h3>
              {historyQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>PO</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="text-code-sku font-mono font-semibold text-foreground">
                            {po.poNumber}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(po.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[po.status]}>
                              {po.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-code-sku text-right font-mono text-foreground">
                            {formatMoney(po.total)}
                          </TableCell>
                          <TableCell className="text-code-sku text-right font-mono text-muted-foreground">
                            {formatMoney(po.amountPaid)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
