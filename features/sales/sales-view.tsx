"use client";

import * as React from "react";
import { Search, ReceiptText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import type { OrderStatus, SaleOrder } from "@/lib/data/types";
import { InvoiceDialog } from "./invoice-dialog";
import { RefundDialog } from "./refund-dialog";
import { SaleDetailSheet } from "./sale-detail";
import { SalesKpis } from "./sales-kpis";
import { SalesTable } from "./sales-table";
import { useSalesKpis, useSalesOrders } from "./use-sales";

const STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "voided", label: "Voided" },
];

export function SalesView() {
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId;

  const [status, setStatus] = React.useState<OrderStatus | "all">("all");
  const [q, setQ] = React.useState("");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [invoice, setInvoice] = React.useState<SaleOrder | null>(null);
  const [refunding, setRefunding] = React.useState<SaleOrder | null>(null);

  const ordersQuery = useSalesOrders({ status, q: q || undefined });
  const kpisQuery = useSalesKpis(storeId);
  const orders = React.useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const filtered = status !== "all" || q !== "";
  const detail = React.useMemo(() => orders.find((o) => o.id === detailId) ?? null, [orders, detailId]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core Operations"
        title="Sales & Orders"
        description="Order history, invoices, and refunds across every terminal."
      />

      <SalesKpis kpis={kpisQuery.data} loading={kpisQuery.isLoading} />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order number or customer…"
            className="bg-muted ps-9"
            aria-label="Search sales"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
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
          icon={ReceiptText}
          title={filtered ? "No matching orders" : "No sales yet"}
          description={filtered ? "Try a different search or status filter." : "Completed POS sales will appear here."}
        />
      ) : (
        <SalesTable orders={orders} onOpen={(order) => setDetailId(order.id)} />
      )}

      <SaleDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetailId(null)}
        order={detail}
        onInvoice={(order) => {
          setDetailId(null);
          setInvoice(order);
        }}
        onRefund={(order) => {
          setDetailId(null);
          setRefunding(order);
        }}
      />
      {invoice ? (
        <InvoiceDialog open onOpenChange={(open) => !open && setInvoice(null)} order={invoice} />
      ) : null}
      {refunding ? (
        <RefundDialog open onOpenChange={(open) => !open && setRefunding(null)} order={refunding} />
      ) : null}
    </div>
  );
}
