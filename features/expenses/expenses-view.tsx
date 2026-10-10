"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import { toUserMessage } from "@/lib/data/errors";
import type { Expense, ExpenseCategory } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { EXPENSE_CATEGORY_OPTIONS, expenseCategoryLabel } from "./categories";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { useExpenseKpis, useExpenseMutations, useExpenses } from "./use-expenses";

export function ExpensesView() {
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId;
  const stores = session?.stores ?? [];

  const [category, setCategory] = React.useState<ExpenseCategory | "all">("all");
  const [q, setQ] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [deleting, setDeleting] = React.useState<Expense | null>(null);

  const expensesQuery = useExpenses({ storeId, category, q: q || undefined });
  const kpisQuery = useExpenseKpis(storeId);
  const { remove } = useExpenseMutations();
  const expenses = expensesQuery.data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Expense removed");
      setDeleting(null);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const kpis = kpisQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations &amp; Finance"
        title="Expenses & Cashflow"
        description="Record store-scoped expenses by category and track spend."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Record expense
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {kpisQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : !kpis ? null : (
          <>
            <Kpi label="Total (30 days)" value={formatMoney(kpis.totalThisPeriod)} icon={Wallet} />
            <Kpi
              label="Top category"
              value={kpis.topCategory ? expenseCategoryLabel(kpis.topCategory.category) : "—"}
              sub={kpis.topCategory ? formatMoney(kpis.topCategory.amount) : undefined}
            />
            <Kpi label="Entries (30 days)" value={String(kpis.count)} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search expenses…"
            className="bg-muted ps-9"
            aria-label="Search expenses"
          />
        </div>
        <NativeSelect
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory | "all")}
          aria-label="Category filter"
          className="sm:w-56"
        >
          <option value="all">All categories</option>
          {EXPENSE_CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {expensesQuery.isError ? (
        <ErrorState error={expensesQuery.error} onRetry={() => expensesQuery.refetch()} />
      ) : expensesQuery.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses"
          description="Record an expense to start tracking spend."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Record expense
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-end">Amount</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(expense.spentAt)}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {expenseCategoryLabel(expense.category)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.storeName}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                    {expense.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-code-sku text-end font-mono font-semibold text-foreground">
                    {formatMoney(expense.amount)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditing(expense);
                          setFormOpen(true);
                        }}
                        aria-label="Edit expense"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setDeleting(expense)}
                        disabled={remove.isPending}
                        aria-label={`Delete expense from ${formatDate(expense.spentAt)}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen ? (
        <ExpenseFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          expense={editing}
          stores={stores}
          defaultStoreId={storeId ?? ""}
        />
      ) : null}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this expense?</DialogTitle>
            <DialogDescription>
              This removes the {deleting ? formatMoney(deleting.amount) : "selected"} expense from
              the mock ledger. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              Keep expense
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </div>
      <span className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </Card>
  );
}
