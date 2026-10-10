"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { toUserMessage } from "@/lib/data/errors";
import type { Customer, CustomerListItem } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { CustomerDetailSheet } from "./customer-detail";
import { CustomerFormDialog } from "./customer-form-dialog";
import { useCustomerMutations, useCustomers } from "./use-customers";

export function CustomersView() {
  const customersQuery = useCustomers();
  const { setStatus } = useCustomerMutations();
  const [q, setQ] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [detail, setDetail] = React.useState<CustomerListItem | null>(null);

  const customers = customersQuery.data ?? [];
  const filtered = customers.filter((c) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      (c.email ?? "").toLowerCase().includes(needle) ||
      (c.phone ?? "").includes(needle)
    );
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(customer: Customer) {
    setDetail(null);
    setEditing(customer);
    setFormOpen(true);
  }
  async function toggleStatus(customer: CustomerListItem) {
    try {
      await setStatus.mutateAsync({
        id: customer.id,
        status: customer.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog &amp; Supply"
        title="Customers"
        description="Customer directory with loyalty tiers, credit limits, and balances."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Add customer
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          className="ps-9"
          aria-label="Search customers"
        />
      </div>

      {customersQuery.isError ? (
        <ErrorState error={customersQuery.error} onRetry={() => customersQuery.refetch()} />
      ) : customersQuery.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : filtered.length === 0 ? (
        q.trim() ? (
          <EmptyState
            icon={Users}
            title="No customers match your search"
            description={`Nothing matches “${q.trim()}”.`}
            action={
              <Button variant="outline" onClick={() => setQ("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No customers"
            description="Add a customer to track loyalty and house credit."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add customer
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-end">Spent</TableHead>
                <TableHead className="text-end">Balance</TableHead>
                <TableHead className="text-center">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setDetail(customer)}
                      className="text-start text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {customer.name}
                    </button>
                    <span className="block text-xs text-muted-foreground">
                      {customer.email ?? customer.phone ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {customer.loyaltyTier ? (
                      <Badge variant="info">{customer.loyaltyTier}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="text-code-sku text-end font-mono text-foreground">
                    {formatMoney(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-end">
                    {customer.balance.amountMinor > 0 ? (
                      <span className="text-code-sku font-mono font-semibold text-warning">
                        {formatMoney(customer.balance)}
                      </span>
                    ) : (
                      <Badge variant="success">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={customer.status === "active"}
                      onCheckedChange={() => toggleStatus(customer)}
                      aria-label={`${customer.name} is ${customer.status}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen ? (
        <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
      ) : null}
      <CustomerDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        customer={detail}
        onEdit={openEdit}
      />
    </div>
  );
}
