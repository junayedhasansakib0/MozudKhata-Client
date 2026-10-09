"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { Category } from "@/lib/data/types";

interface BulkCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  categories: Category[];
  pending: boolean;
  onApply: (categoryId: string) => void;
}

export function BulkCategoryDialog({
  open,
  onOpenChange,
  count,
  categories,
  pending,
  onApply,
}: BulkCategoryDialogProps) {
  // Mounted fresh each time it opens (parent renders it conditionally), so the first
  // category is a safe initial value without a reset effect.
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change category</DialogTitle>
          <DialogDescription>
            Move {count} selected {count === 1 ? "product" : "products"} to a new category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Category</Label>
          <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => onApply(categoryId)} disabled={!categoryId || pending}>
            {pending ? "Applying…" : "Change category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
