import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { Activity, Boxes, Package, PackageX, Tags, TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { MovementTypeBadge } from "@/features/inventory/components/movement-type-badge";
import { useDashboard } from "@/features/dashboard/hooks";
import type { DashboardActivity } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

/**
 * Phase 07 dashboard: an at-a-glance inventory overview. All metrics come from
 * the owner-scoped `GET /api/v1/dashboard` aggregate endpoint; nothing is
 * computed client-side. Cards + recent activity have filter-aware empty states.
 */

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

type Tone = "default" | "warning" | "destructive";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  const accent =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} aria-hidden />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tracking-tight", accent)}>{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: DashboardActivity }) {
  const delta = item.quantityDelta;
  const positive = !delta.startsWith("-");
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <Link to={`/products/${item.productId}`} className="truncate font-medium hover:underline">
          {item.productName}
        </Link>
        <p className="text-xs text-muted-foreground">
          {dateFmt.format(new Date(item.createdAt))}
          {item.reason ? ` · ${item.reason}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "tabular-nums text-sm font-medium",
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {positive ? `+${delta}` : delta}
        </span>
        <MovementTypeBadge type={item.type} />
      </div>
    </li>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">An at-a-glance overview of your inventory.</p>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading dashboard…
        </p>
      )}

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load the dashboard: {(error as Error).message}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Products" value={data.totalProducts} icon={Package} />
            <StatCard label="Stock units" value={data.totalStockUnits} icon={Boxes} />
            <StatCard
              label="Low stock"
              value={data.lowStockCount}
              icon={TriangleAlert}
              tone={data.lowStockCount > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Out of stock"
              value={data.outOfStockCount}
              icon={PackageX}
              tone={data.outOfStockCount > 0 ? "destructive" : "default"}
            />
            <StatCard label="Categories" value={data.categoryCount} icon={Tags} />
          </div>

          {data.totalProducts === 0 && data.categoryCount === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Get started</CardTitle>
                <CardDescription>
                  Your inventory is empty. Add a category and your first product to begin
                  tracking stock.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link to="/products/new" className={buttonVariants()}>
                  Add product
                </Link>
                <Link to="/categories" className={buttonVariants({ variant: "outline" })}>
                  Manage categories
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>Latest stock movements across your products.</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No stock movements yet. Record one from a product&apos;s page.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.recentActivity.map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
