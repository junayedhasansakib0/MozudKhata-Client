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
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { toUserMessage } from "@/lib/data/errors";
import { useCategories, useCategoryMutations } from "../use-catalog";

export function CategoriesManager() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [newName, setNewName] = React.useState("");
  const [newParent, setNewParent] = React.useState("");
  const [deleting, setDeleting] = React.useState<{ id: string; name: string } | null>(null);

  async function add() {
    const name = newName.trim();
    if (!name) return;
    try {
      await create.mutateAsync({ name, parentId: newParent || null });
      setNewName("");
      setNewParent("");
      toast.success("Category added");
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function rename(id: string, name: string, parentId: string | null) {
    try {
      await update.mutateAsync({ id, input: { name, parentId } });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Category removed");
      setDeleting(null);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }
  if (isLoading || !categories) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category name"
          aria-label="New category name"
        />
        <NativeSelect
          value={newParent}
          onChange={(e) => setNewParent(e.target.value)}
          aria-label="Parent category"
          className="sm:w-48"
        >
          <option value="">Top level</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <Button onClick={add} disabled={!newName.trim() || create.isPending}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 p-2">
            <Input
              defaultValue={category.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== category.name) rename(category.id, name, category.parentId);
              }}
              aria-label={`Category ${category.name}`}
            />
            <span className="w-28 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
              {category.productCount} products
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => setDeleting({ id: category.id, name: category.name })}
              disabled={category.productCount > 0 || remove.isPending}
              title={category.productCount > 0 ? "Reassign products first" : "Delete category"}
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this category?</DialogTitle>
            <DialogDescription>
              This removes “{deleting?.name}” from the mock catalog. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              Keep category
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
