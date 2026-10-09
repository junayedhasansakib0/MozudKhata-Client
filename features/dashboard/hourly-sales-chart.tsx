import type { HourlyPoint } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";

function money(amountMinor: number): string {
  return formatMoney({ amountMinor, currency: "USD" });
}

/** Single-series hourly sales. HTML bars: 4px rounded data-ends, baseline-anchored,
 *  2px+ surface gaps, per-bar hover tooltip (dataviz mark + interaction specs). */
export function HourlySalesChart({ data }: { data: HourlyPoint[] }) {
  const max = Math.max(...data.map((point) => point.sales), 1);

  return (
    <div>
      <div
        className="flex h-44 items-end gap-1.5"
        role="img"
        aria-label="Hourly sales for the selected day"
      >
        {data.map((point) => {
          const pct = (point.sales / max) * 100;
          return (
            <div
              key={point.hour}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                <span className="font-medium text-foreground">{money(point.sales)}</span>
                <span className="block text-muted-foreground">{point.hour}</span>
              </div>
              <div
                className="w-full rounded-t bg-primary/85 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${point.hour}: ${money(point.sales)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((point) => (
          <div key={point.hour} className="flex-1 text-center text-[10px] text-muted-foreground">
            {point.hour}
          </div>
        ))}
      </div>
    </div>
  );
}
