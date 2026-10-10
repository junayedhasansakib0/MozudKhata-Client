"use client";

import { ClipboardList, Coins, PackageCheck, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PurchaseKpis as PurchaseKpisData } from "@/lib/data/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PurchaseKpisProps {
  kpis: PurchaseKpisData | undefined;
  loading: boolean;
}

export function PurchaseKpis({ kpis, loading }: PurchaseKpisProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (!kpis) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={ClipboardList}
        label="Open orders"
        value={formatNumber(kpis.openOrders)}
        hint="Draft + awaiting"
      />
      <Tile
        icon={PackageCheck}
        label="Awaiting receipt"
        value={formatNumber(kpis.awaitingReceipt)}
        hint="Ordered / partial"
        tone="warning"
      />
      <Tile
        icon={Wallet}
        label="Outstanding payables"
        value={formatMoney(kpis.outstandingPayables)}
        hint="Unpaid balances"
        tone={kpis.outstandingPayables.amountMinor > 0 ? "warning" : "muted"}
        money
      />
      <Tile
        icon={Coins}
        label="Spend (30 days)"
        value={formatMoney(kpis.spendThisPeriod)}
        hint="Committed POs"
        money
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "muted",
  money = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone?: "muted" | "warning";
  money?: boolean;
}) {
  return (
    <Card className="flex flex-col justify-between gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn("size-4", tone === "warning" ? "text-warning" : "text-muted-foreground")}
        />
      </div>
      <div
        className={cn(
          "font-display tabular-nums text-foreground",
          money ? "text-2xl font-bold" : "text-kpi",
        )}
      >
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
