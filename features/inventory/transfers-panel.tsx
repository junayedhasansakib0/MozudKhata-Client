"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight, Plus, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toUserMessage } from "@/lib/data/errors";
import type { Store, StockTransfer, TransferStatus } from "@/lib/data/types";
import { formatRelativeTime } from "@/lib/format";
import { ReceiveTransferDialog } from "./receive-transfer-dialog";
import { TransferFormDialog } from "./transfer-form-dialog";
import { useInventoryMutations, useTransfers } from "./use-inventory";

const STATUS_VARIANT: Record<TransferStatus, "secondary" | "info" | "success" | "outline"> = {
  draft: "secondary",
  in_transit: "info",
  received: "success",
  cancelled: "outline",
};

const STATUS_LABEL: Record<TransferStatus, string> = {
  draft: "Draft",
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
};

interface TransfersPanelProps {
  storeId: string;
  stores: Store[];
}

export function TransfersPanel({ storeId, stores }: TransfersPanelProps) {
  const transfersQuery = useTransfers(storeId);
  const { ship, cancel } = useInventoryMutations();
  const [formOpen, setFormOpen] = React.useState(false);
  const [receiving, setReceiving] = React.useState<StockTransfer | null>(null);
  const [canceling, setCanceling] = React.useState<StockTransfer | null>(null);

  async function doShip(transfer: StockTransfer) {
    try {
      await ship.mutateAsync(transfer.id);
      toast.success(`Shipped ${transfer.reference}`);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function confirmCancel() {
    if (!canceling) return;
    try {
      await cancel.mutateAsync(canceling.id);
      toast.success(`Cancelled ${canceling.reference}`);
      setCanceling(null);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const transfers = transfersQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          New transfer
        </Button>
      </div>

      {transfersQuery.isError ? (
        <ErrorState error={transfersQuery.error} onRetry={() => transfersQuery.refetch()} />
      ) : transfersQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No transfers"
          description="Create a transfer to move stock between stores."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              New transfer
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Reference</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="text-code-sku font-mono font-semibold text-foreground">
                    {transfer.reference}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      {transfer.fromStoreName}
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      {transfer.toStoreName}
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {transfer.items.length}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <Badge variant={STATUS_VARIANT[transfer.status]}>
                        {STATUS_LABEL[transfer.status]}
                      </Badge>
                      {transfer.hasDiscrepancy ? (
                        <Badge variant="warning">Discrepancy</Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(
                      transfer.receivedAt ?? transfer.shippedAt ?? transfer.createdAt,
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      {transfer.status === "draft" ? (
                        <Button
                          size="sm"
                          onClick={() => doShip(transfer)}
                          disabled={ship.isPending}
                        >
                          Ship
                        </Button>
                      ) : null}
                      {transfer.status === "in_transit" ? (
                        <Button size="sm" onClick={() => setReceiving(transfer)}>
                          Receive
                        </Button>
                      ) : null}
                      {transfer.status === "draft" || transfer.status === "in_transit" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCanceling(transfer)}
                          disabled={cancel.isPending}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen ? (
        <TransferFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          stores={stores}
          defaultFromStoreId={storeId}
        />
      ) : null}
      <ReceiveTransferDialog
        open={receiving !== null}
        onOpenChange={(open) => !open && setReceiving(null)}
        transfer={receiving}
      />
      <Dialog open={canceling !== null} onOpenChange={(open) => !open && setCanceling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this transfer?</DialogTitle>
            <DialogDescription>
              {canceling
                ? `Transfer ${canceling.reference} (${canceling.fromStoreName} → ${canceling.toStoreName}) will be cancelled in the mock ledger. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCanceling(null)}
              disabled={cancel.isPending}
            >
              Keep transfer
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancel.isPending}>
              {cancel.isPending ? "Cancelling…" : "Cancel transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
