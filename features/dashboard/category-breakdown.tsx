import type { CategorySlice } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";

/** Category magnitude comparison — single hue (identity carried by the label). */
export function CategoryBreakdown({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.amount, 0) || 1;
  const max = Math.max(...data.map((slice) => slice.amount), 1);

  return (
    <ul className="space-y-3">
      {data.map((slice) => {
        const sharePct = (slice.amount / total) * 100;
        const barPct = (slice.amount / max) * 100;
        return (
          <li key={slice.category}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">{slice.category}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatMoney({ amountMinor: slice.amount, currency: "USD" })} ·{" "}
                {sharePct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(barPct, 2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
