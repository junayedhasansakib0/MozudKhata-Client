"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { toUserMessage } from "@/lib/data/errors";
import { useBrandMutations, useBrands } from "../use-catalog";

export function BrandsManager() {
  const { data: brands, isLoading, isError, error, refetch } = useBrands();
  const { create, update, remove } = useBrandMutations();
  const [newName, setNewName] = React.useState("");
  const [deleting, setDeleting] = React.useState<{ id: string; name: string } | null>(null);

  async function add() {
    const name = newName.trim();
    if (!name) return;
    try {
      await create.mutateAsync({ name });
      setNewName("");
      toast.success("Brand added");
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function rename(id: string, name: string) {
    try {
      await update.mutateAsync({ id, input: { name } });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Brand removed");
      setDeleting(null);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }
  if (isLoading || !brands) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New brand name"
          aria-label="New brand name"
        />
        <Button onClick={add} disabled={!newName.trim() || create.isPending}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {brands.map((brand) => (
          <li key={brand.id} className="flex items-center gap-2 p-2">
            <Input
              defaultValue={brand.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== brand.name) rename(brand.id, name);
              }}
              aria-label={`Brand ${brand.name}`}
            />
            <span className="w-28 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
              {brand.productCount} products
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => setDeleting({ id: brand.id, name: brand.name })}
              disabled={brand.productCount > 0 || remove.isPending}
              title={brand.productCount > 0 ? "Reassign products first" : "Delete brand"}
              aria-label={`Delete ${brand.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this brand?</DialogTitle>
            <DialogDescription>
              This removes “{deleting?.name}” from the mock catalog. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              Keep brand
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
