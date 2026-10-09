"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import type { InventoryItem, StockLevelKey } from "@/lib/data/types";
import { AdjustmentDrawer } from "./adjustment-drawer";
import { InventoryKpis } from "./inventory-kpis";
import { MovementLedger } from "./movement-ledger";
import { StockTable } from "./stock-table";
import { TransfersPanel } from "./transfers-panel";
import { useInventoryItems, useInventoryKpis } from "./use-inventory";

export function InventoryView() {
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId;
  const stores = session?.stores ?? [];

  const [tab, setTab] = React.useState("stock");
  const [q, setQ] = React.useState("");
  const [level, setLevel] = React.useState<StockLevelKey | "all">("all");
  const [adjusting, setAdjusting] = React.useState<InventoryItem | null>(null);

  const kpisQuery = useInventoryKpis(storeId);
  const itemsQuery = useInventoryItems(storeId ? { storeId, q, level } : null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core Operations"
        title="Inventory & Stock"
        description="Per-store stock levels, audited adjustments, transfers, and the movement ledger."
      />

      <InventoryKpis kpis={kpisQuery.data} loading={kpisQuery.isLoading || !storeId} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock list</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="ledger">Movement ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by product name, SKU, or barcode…"
                className="bg-muted pl-9"
                aria-label="Search stock"
              />
            </div>
            <NativeSelect
              value={level}
              onChange={(e) => setLevel(e.target.value as StockLevelKey | "all")}
              aria-label="Stock status"
              className="sm:w-48"
            >
              <option value="all">All stock levels</option>
              <option value="ok">Optimal</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </NativeSelect>
          </div>

          {itemsQuery.isError ? (
            <ErrorState error={itemsQuery.error} onRetry={() => itemsQuery.refetch()} />
          ) : itemsQuery.isLoading || !storeId ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <StockTable items={itemsQuery.data ?? []} onAdjust={setAdjusting} />
          )}
        </TabsContent>

        <TabsContent value="transfers">
          {storeId ? <TransfersPanel storeId={storeId} stores={stores} /> : <Skeleton className="h-64 w-full" />}
        </TabsContent>

        <TabsContent value="ledger">
          {storeId ? <MovementLedger storeId={storeId} /> : <Skeleton className="h-64 w-full" />}
        </TabsContent>
      </Tabs>

      <AdjustmentDrawer
        open={adjusting !== null}
        onOpenChange={(open) => !open && setAdjusting(null)}
        item={adjusting}
      />
    </div>
  );
}
