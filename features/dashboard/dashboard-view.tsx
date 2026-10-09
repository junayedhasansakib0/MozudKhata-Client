"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/states/page-header";
import { ErrorState } from "@/components/states/error-state";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import type { DateRangeKey } from "@/lib/data/repositories";
import { formatMoney, formatNumber } from "@/lib/format";
import { useDashboard } from "./use-dashboard";
import { DateRangeFilter } from "./date-range-filter";
import { KpiCard } from "./kpi-card";
import { HourlySalesChart } from "./hourly-sales-chart";
import { CategoryBreakdown } from "./category-breakdown";
import { TopProducts } from "./top-products";
import { LowStockList } from "./low-stock-list";
import { RecentTransactions } from "./recent-transactions";
import { CashDrawerCard } from "./cash-drawer-card";

function Section({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DashboardView() {
  const [range, setRange] = React.useState<DateRangeKey>("today");
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId;
  const { data, isLoading, isError, error, refetch } = useDashboard(storeId, range);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Real-time sales, profit, and inventory health across your stores."
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />
      {/* __DASHBOARD_BODY__ */}
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 w-full lg:col-span-2" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Net profit"
              value={formatMoney(data.kpis.netProfit.value)}
              deltaPct={data.kpis.netProfit.deltaPct}
              spark={data.kpis.netProfit.spark}
            />
            <KpiCard
              label="Gross sales"
              value={formatMoney(data.kpis.grossSales.value)}
              deltaPct={data.kpis.grossSales.deltaPct}
              spark={data.kpis.grossSales.spark}
            />
            <KpiCard
              label="Total orders"
              value={formatNumber(data.kpis.totalOrders.value)}
              deltaPct={data.kpis.totalOrders.deltaPct}
              spark={data.kpis.totalOrders.spark}
            />
            <KpiCard
              label="Avg. order value"
              value={formatMoney(data.kpis.avgOrderValue.value)}
              deltaPct={data.kpis.avgOrderValue.deltaPct}
              spark={data.kpis.avgOrderValue.spark}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Section title="Hourly sales velocity" className="lg:col-span-2">
              <HourlySalesChart data={data.hourly} />
            </Section>
            <Section title="Sales by category">
              <CategoryBreakdown data={data.categories} />
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Section title="Top products">
              <TopProducts data={data.topProducts} />
            </Section>
            <Section title="Low stock alerts">
              <LowStockList data={data.lowStock} />
            </Section>
            <Section title="Cash drawer">
              <CashDrawerCard data={data.cashDrawer} />
            </Section>
          </div>

          <Section title="Recent transactions">
            <RecentTransactions data={data.recentTransactions} />
          </Section>
        </>
      )}
    </div>
  );
}
