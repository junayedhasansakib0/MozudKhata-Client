import type { TopProduct } from "@/lib/data/types";
import { formatMoney, formatNumber } from "@/lib/format";

export function TopProducts({ data }: { data: TopProduct[] }) {
  const max = Math.max(...data.map((product) => product.revenue.amountMinor), 1);

  return (
    <ol className="space-y-3">
      {data.map((product, index) => (
        <li key={product.id} className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatMoney(product.revenue)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(product.revenue.amountMinor / max) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatNumber(product.unitsSold)} sold
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
