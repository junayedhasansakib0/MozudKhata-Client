"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ClipboardList } from "lucide-react";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import type { PurchaseOrder, PurchaseStatus } from "@/lib/data/types";
import { PoDetailSheet } from "./po-detail-sheet";
import { PoFormDialog } from "./po-form-dialog";
import { PurchaseKpis } from "./purchase-kpis";
import { PurchasesTable } from "./purchases-table";
import { ReceivePoDialog } from "./receive-po-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { usePurchaseKpis, usePurchaseOrders } from "./use-purchases";

const STATUSES: { value: PurchaseStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "ordered", label: "Ordered" },
  { value: "partially_received", label: "Partially received" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

export function PurchasesView() {
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId ?? "";
  const stores = session?.stores ?? [];

  const [status, setStatus] = React.useState<PurchaseStatus | "all">("all");
  const [q, setQ] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [receiving, setReceiving] = React.useState<PurchaseOrder | null>(null);
  const [paying, setPaying] = React.useState<PurchaseOrder | null>(null);

  const ordersQuery = usePurchaseOrders({ status, q: q || undefined });
  const kpisQuery = usePurchaseKpis();
  const orders = React.useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const filtered = status !== "all" || q !== "";
  // Derive the open PO from the live list so in-sheet actions reflect immediately.
  const detail = React.useMemo(
    () => orders.find((o) => o.id === detailId) ?? null,
    [orders, detailId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog &amp; Supply"
        title="Purchases & POs"
        description="Raise purchase orders, receive stock, and track supplier payments."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New PO
          </Button>
        }
      />

      <PurchaseKpis kpis={kpisQuery.data} loading={kpisQuery.isLoading} />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by PO number or supplier…"
            className="bg-muted pl-9"
            aria-label="Search purchase orders"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseStatus | "all")}
          aria-label="Filter status"
          className="sm:w-56"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {ordersQuery.isError ? (
        <ErrorState error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
      ) : ordersQuery.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filtered ? "No matching purchase orders" : "No purchase orders yet"}
          description={
            filtered ? "Try a different search or status filter." : "Raise your first PO against a supplier."
          }
          action={
            !filtered ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" />
                New PO
              </Button>
            ) : undefined
          }
        />
      ) : (
        <PurchasesTable orders={orders} onOpen={(order) => setDetailId(order.id)} onReceive={setReceiving} />
      )}

      {formOpen ? (
        <PoFormDialog open={formOpen} onOpenChange={setFormOpen} stores={stores} defaultStoreId={storeId} />
      ) : null}

      <PoDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetailId(null)}
        order={detail}
        onReceive={(order) => {
          setDetailId(null);
          setReceiving(order);
        }}
        onRecordPayment={(order) => {
          setDetailId(null);
          setPaying(order);
        }}
      />

      {receiving ? (
        <ReceivePoDialog open onOpenChange={(open) => !open && setReceiving(null)} order={receiving} />
      ) : null}
      {paying ? (
        <RecordPaymentDialog open onOpenChange={(open) => !open && setPaying(null)} order={paying} />
      ) : null}
    </div>
  );
}
