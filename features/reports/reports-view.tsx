"use client";

import * as React from "react";

import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/states/page-header";
import { DateRangeFilter } from "@/features/dashboard/date-range-filter";
import { useSession } from "@/hooks/use-session";
import type { DateRangeKey } from "@/lib/data/repositories";
import type { ReportKey } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { ReportView } from "./report-view";

const REPORTS: { key: ReportKey; title: string }[] = [
  { key: "sales", title: "Sales" },
  { key: "profit", title: "Profit" },
  { key: "inventory", title: "Inventory" },
  { key: "purchases", title: "Purchases" },
  { key: "customers", title: "Customers" },
  { key: "suppliers", title: "Suppliers" },
  { key: "expenses", title: "Expenses" },
  { key: "tax", title: "Tax" },
];

export function ReportsView() {
  const { data: session } = useSession();
  const stores = session?.stores ?? [];
  const [active, setActive] = React.useState<ReportKey>("sales");
  const [range, setRange] = React.useState<DateRangeKey>("30d");
  const [storeId, setStoreId] = React.useState<string>("");
  const tabsId = React.useId();

  function moveReportFocus(direction: "next" | "previous" | "first" | "last") {
    const triggers = Array.from(
      document.querySelectorAll<HTMLButtonElement>(`[data-report-tabs="${tabsId}"][role="tab"]`),
    );
    if (triggers.length === 0) return;
    const currentIndex = Math.max(0, triggers.indexOf(document.activeElement as HTMLButtonElement));
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? triggers.length - 1
          : (currentIndex + (direction === "next" ? 1 : -1) + triggers.length) % triggers.length;
    const next = triggers[nextIndex];
    if (!next) return;
    const nextKey = next.dataset.reportKey as ReportKey | undefined;
    if (!nextKey) return;
    setActive(nextKey);
    next.focus();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations &amp; Finance"
        title="Analytics & Reports"
        description="Sales, profit, inventory, purchases, customers, suppliers, expenses, and tax."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store filter" className="w-auto">
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
            <DateRangeFilter value={range} onChange={setRange} />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Reports" aria-orientation="horizontal">
        {REPORTS.map((report) => (
          <button
            key={report.key}
            type="button"
            role="tab"
            id={`${tabsId}-tab-${report.key}`}
            data-report-tabs={tabsId}
            data-report-key={report.key}
            aria-selected={active === report.key}
            aria-controls={`${tabsId}-panel`}
            tabIndex={active === report.key ? 0 : -1}
            onClick={() => setActive(report.key)}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowRight":
                case "ArrowDown":
                  event.preventDefault();
                  moveReportFocus("next");
                  break;
                case "ArrowLeft":
                case "ArrowUp":
                  event.preventDefault();
                  moveReportFocus("previous");
                  break;
                case "Home":
                  event.preventDefault();
                  moveReportFocus("first");
                  break;
                case "End":
                  event.preventDefault();
                  moveReportFocus("last");
                  break;
              }
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === report.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {report.title}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${active}`} tabIndex={0}>
        <ReportView reportKey={active} params={{ range, storeId: storeId || undefined }} />
      </div>
    </div>
  );
}
