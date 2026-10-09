"use client";

import { AlertTriangle, GitBranch, Package, PackageCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogSummary } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CatalogKpisProps {
  summary: CatalogSummary | undefined;
  loading: boolean;
}

export function CatalogKpis({ summary, loading }: CatalogKpisProps) {
  if (loading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const activePct =
    summary.totalProducts > 0
      ? Math.round((summary.activeProducts / summary.totalProducts) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={Package}
        label="Total products"
        value={formatNumber(summary.totalProducts)}
        hint={`${summary.categoryCount} categories`}
      />
      <Tile
        icon={PackageCheck}
        label="Active on POS"
        value={formatNumber(summary.activeProducts)}
        hint={`${activePct}% live`}
        tone="success"
      />
      <Tile
        icon={GitBranch}
        label="Multi-variant"
        value={formatNumber(summary.variantProducts)}
        hint={`${formatNumber(summary.totalVariants)} SKUs`}
      />
      <Tile
        icon={AlertTriangle}
        label="Attention needed"
        value={formatNumber(summary.attentionCount)}
        hint="Low stock / missing barcode"
        tone={summary.attentionCount > 0 ? "danger" : "muted"}
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone?: "muted" | "success" | "danger";
}) {
  return (
    <Card className="flex flex-col justify-between gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn(
            "size-4",
            tone === "success"
              ? "text-success"
              : tone === "danger"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        />
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
