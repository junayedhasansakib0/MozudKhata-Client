import type { CashDrawer } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular-nums text-foreground",
          emphasis ? "font-display text-lg font-bold" : "text-sm font-semibold",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CashDrawerCard({ data }: { data: CashDrawer }) {
  const current = data.currentCash.amountMinor;
  const target = Math.max(data.projectedClose.amountMinor, current, 1);
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Opening float" value={formatMoney(data.openingFloat)} />
        <Stat label="In drawer" value={formatMoney(data.currentCash)} emphasis />
        <Stat label="Projected close" value={formatMoney(data.projectedClose)} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Register load</span>
          <span className="tabular-nums">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
