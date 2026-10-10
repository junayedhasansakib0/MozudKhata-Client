"use client";

import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportKey, ReportParams } from "@/lib/data/types";
import { reportToCsv } from "./report-csv";
import { useReport } from "./use-reports";

interface ReportViewProps {
  reportKey: ReportKey;
  params: ReportParams;
}

export function ReportView({ reportKey, params }: ReportViewProps) {
  const { data, isLoading, isError, error, refetch } = useReport(reportKey, params);

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const max = Math.max(...data.chart.map((p) => p.value), 1);

  function exportCsv() {
    if (!data) return;
    const blob = new Blob([reportToCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mozudkhata-${data.key}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-headline-md font-semibold text-foreground">{data.title}</h2>
          <p className="text-sm text-muted-foreground">{data.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <Card key={kpi.label} className="flex flex-col gap-1 p-4">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
            <span className="font-display text-xl font-bold tabular-nums text-foreground">{kpi.value}</span>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {data.chartLabel}
        </h3>
        {data.chart.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data in this period.</p>
        ) : (
          <ul className="space-y-2">
            {data.chart.map((point) => (
              <li key={point.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs text-muted-foreground" title={point.label}>
                  {point.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-primary" style={{ width: `${Math.max((point.value / max) * 100, 2)}%` }} />
                </div>
                <span className="w-24 shrink-0 text-end font-mono text-code-sku tabular-nums text-foreground">
                  {point.value >= 1000 ? `$${(point.value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : point.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.rows.length === 0 ? (
        <EmptyState icon={BarChart3} title="No rows" description="No records match the selected period." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {data.columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className={j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
