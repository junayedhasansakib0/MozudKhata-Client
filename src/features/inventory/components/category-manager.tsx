import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useArchiveCategory,
  useCategories,
  useRestoreCategory,
  useUpdateCategory,
} from "../hooks";
import type { Category } from "../types";
import { CategoryForm } from "./category-form";

/** A single category row with inline rename and archive/restore controls. */
function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const updateCategory = useUpdateCategory();
  const archiveCategory = useArchiveCategory();
  const restoreCategory = useRestoreCategory();
  const isArchived = category.archivedAt !== null;

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      setName(category.name);
      return;
    }
    await updateCategory.mutateAsync({ id: category.id, name: trimmed });
    setEditing(false);
  };

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      {editing ? (
        <Input
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
      ) : (
        <span className="flex items-center gap-2">
          <span className={isArchived ? "text-muted-foreground line-through" : undefined}>
            {category.name}
          </span>
          {isArchived && <Badge variant="muted">Archived</Badge>}
        </span>
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={save} disabled={updateCategory.isPending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(category.name);
              }}
            >
              Cancel
            </Button>
          </>
        ) : isArchived ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => restoreCategory.mutate(category.id)}
            disabled={restoreCategory.isPending}
          >
            Restore
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Rename
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => archiveCategory.mutate(category.id)}
              disabled={archiveCategory.isPending}
            >
              Archive
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

/** Full category management: add, list (incl. archived), rename, archive/restore. */
export function CategoryManager() {
  const categories = useCategories(true);

  return (
    <div className="space-y-6">
      <CategoryForm />

      {categories.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : categories.data && categories.data.length > 0 ? (
        <ul className="divide-y">
          {categories.data.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      )}
    </div>
  );
}
