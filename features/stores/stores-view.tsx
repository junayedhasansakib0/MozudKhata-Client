"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus, Store as StoreIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Store } from "@/lib/data/types";
import { StoreFormDialog } from "./store-form-dialog";
import { useStoreMutations, useStoresAdmin } from "./use-stores-admin";

export function StoresView() {
  const storesQuery = useStoresAdmin();
  const { setStatus } = useStoreMutations();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Store | null>(null);

  const stores = storesQuery.data ?? [];

  async function toggle(store: Store) {
    try {
      await setStatus.mutateAsync({
        id: store.id,
        status: store.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations &amp; Finance"
        title="Stores & Branches"
        description="Manage store locations, codes, and status across the network."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add store
          </Button>
        }
      />

      {storesQuery.isError ? (
        <ErrorState error={storesQuery.error} onRetry={() => storesQuery.refetch()} />
      ) : storesQuery.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Add your first store location to start tracking inventory and sales."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add store
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Store</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="text-sm font-semibold text-foreground">
                    {store.name}
                  </TableCell>
                  <TableCell className="text-code-sku font-mono text-muted-foreground">
                    {store.code}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{store.city}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{store.currency}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={store.status === "active"}
                      onCheckedChange={() => toggle(store)}
                      aria-label={`${store.name} is ${store.status}`}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setEditing(store);
                        setFormOpen(true);
                      }}
                      aria-label="Edit store"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen ? (
        <StoreFormDialog open={formOpen} onOpenChange={setFormOpen} store={editing} />
      ) : null}
    </div>
  );
}
