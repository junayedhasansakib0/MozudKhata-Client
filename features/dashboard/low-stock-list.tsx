import type { LowStockItem } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";

export function LowStockList({ data }: { data: LowStockItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {data.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {item.sku} · {item.onHand}/{item.threshold} on hand
            </p>
          </div>
          {item.urgency === "out" ? (
            <Badge variant="destructive">Out of stock</Badge>
          ) : (
            <Badge variant="warning">Low</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
