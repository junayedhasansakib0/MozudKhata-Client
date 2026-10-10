"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Search, Truck } from "lucide-react";

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
import type { Supplier, SupplierListItem } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { SupplierDetailSheet } from "./supplier-detail";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { useSupplierMutations, useSuppliers } from "./use-suppliers";

export function SuppliersView() {
  const suppliersQuery = useSuppliers();
  const { setStatus } = useSupplierMutations();
  const [q, setQ] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [detail, setDetail] = React.useState<SupplierListItem | null>(null);

  const suppliers = suppliersQuery.data ?? [];
  const filtered = suppliers.filter((s) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      s.name.toLowerCase().includes(needle) ||
      (s.contactName ?? "").toLowerCase().includes(needle) ||
      (s.email ?? "").toLowerCase().includes(needle)
    );
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(supplier: Supplier) {
    setDetail(null);
    setEditing(supplier);
    setFormOpen(true);
  }
  async function toggleStatus(supplier: SupplierListItem) {
    try {
      await setStatus.mutateAsync({
        id: supplier.id,
        status: supplier.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog &amp; Supply"
        title="Suppliers"
        description="Supplier directory, purchase history, and outstanding balances."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Add supplier
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search suppliers…"
          className="ps-9"
          aria-label="Search suppliers"
        />
      </div>

      {suppliersQuery.isError ? (
        <ErrorState error={suppliersQuery.error} onRetry={() => suppliersQuery.refetch()} />
      ) : suppliersQuery.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : filtered.length === 0 ? (
        q.trim() ? (
          <EmptyState
            icon={Truck}
            title="No suppliers match your search"
            description={`Nothing matches “${q.trim()}”.`}
            action={
              <Button variant="outline" onClick={() => setQ("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="No suppliers"
            description="Add a supplier to raise purchase orders against it."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add supplier
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-end">Outstanding</TableHead>
                <TableHead className="text-center">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setDetail(supplier)}
                      className="text-start text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {supplier.name}
                    </button>
                    {supplier.address ? (
                      <span className="block text-xs text-muted-foreground">
                        {supplier.address}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {supplier.contactName ?? "—"}
                    {supplier.email ? (
                      <span className="block text-xs">{supplier.email}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {supplier.orderCount}
                  </TableCell>
                  <TableCell className="text-end">
                    {supplier.outstanding.amountMinor > 0 ? (
                      <span className="text-code-sku font-mono font-semibold text-warning">
                        {formatMoney(supplier.outstanding)}
                      </span>
                    ) : (
                      <Badge variant="success">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={supplier.status === "active"}
                      onCheckedChange={() => toggleStatus(supplier)}
                      aria-label={`${supplier.name} is ${supplier.status}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen ? (
        <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editing} />
      ) : null}
      <SupplierDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        supplier={detail}
        onEdit={openEdit}
      />
    </div>
  );
}
