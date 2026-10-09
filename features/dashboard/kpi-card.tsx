import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  deltaPct: number;
  spark: number[];
  comparison?: string;
}

export function KpiCard({ label, value, deltaPct, spark, comparison = "vs prev." }: KpiCardProps) {
  const positive = deltaPct >= 0;
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-kpi tabular-nums text-foreground">{value}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
          {comparison}
        </span>
        <div className={cn("w-24", positive ? "text-success" : "text-destructive")}>
          <Sparkline data={spark} />
        </div>
      </div>
    </Card>
  );
}
