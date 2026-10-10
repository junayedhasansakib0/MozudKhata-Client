"use client";

import { AlertTriangle, CheckCircle2, Truck, Wallet, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryKpis as InventoryKpisData } from "@/lib/data/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InventoryKpisProps {
  kpis: InventoryKpisData | undefined;
  loading: boolean;
}

export function InventoryKpis({ kpis, loading }: InventoryKpisProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (!kpis) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="flex flex-col justify-between gap-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Stock valuation
          </span>
          <Wallet className="size-4 text-primary" />
        </div>
        <div className="font-display text-2xl font-bold tabular-nums text-foreground">
          {formatMoney(kpis.valuationCost)}
        </div>
        <p className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Retail value</span>
          <span className="font-semibold tabular-nums text-success">
            {formatMoney(kpis.valuationRetail)}
          </span>
        </p>
      </Card>
      <Tile
        icon={CheckCircle2}
        label="In-stock SKUs"
        value={formatNumber(kpis.inStock)}
        tone="success"
        hint="Healthy levels"
      />
      <Tile
        icon={AlertTriangle}
        label="Low stock"
        value={formatNumber(kpis.low)}
        tone="warning"
        hint="At/below reorder"
      />
      <Tile
        icon={XCircle}
        label="Out of stock"
        value={formatNumber(kpis.out)}
        tone={kpis.out > 0 ? "danger" : "muted"}
        hint="Zero on hand"
      />
      <Tile
        icon={Truck}
        label="In-transit"
        value={formatNumber(kpis.inTransit)}
        tone="muted"
        hint="Shipments moving"
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone: "muted" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-muted-foreground";
  return (
    <Card className="flex flex-col justify-between gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("size-4", toneClass)} />
      </div>
      <div
        className={cn(
          "font-display text-kpi tabular-nums",
          tone === "danger" ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
