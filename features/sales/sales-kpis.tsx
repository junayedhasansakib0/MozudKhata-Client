"use client";

import { Receipt, RotateCcw, ShoppingBag, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesKpis as SalesKpisData } from "@/lib/data/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SalesKpisProps {
  kpis: SalesKpisData | undefined;
  loading: boolean;
}

export function SalesKpis({ kpis, loading }: SalesKpisProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  // Query failed (no data, not loading): defer to the page-level error state rather
  // than holding a skeleton forever.
  if (!kpis) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={TrendingUp}
        label="Gross sales (30d)"
        value={formatMoney(kpis.grossSales)}
        money
      />
      <Tile icon={ShoppingBag} label="Orders (30d)" value={formatNumber(kpis.orderCount)} />
      <Tile
        icon={RotateCcw}
        label="Refunds (30d)"
        value={formatMoney(kpis.refundsTotal)}
        money
        tone={kpis.refundsTotal.amountMinor > 0 ? "warning" : "muted"}
      />
      <Tile icon={Receipt} label="Avg order value" value={formatMoney(kpis.avgOrderValue)} money />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  money = false,
  tone = "muted",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  money?: boolean;
  tone?: "muted" | "warning";
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
    </Card>
  );
}
