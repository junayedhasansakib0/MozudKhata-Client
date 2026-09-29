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

  const cancel = () => {
    setEditing(false);
    setName(category.name);
  };

  if (editing) {
    return (
      <li className="py-2">
        <form
          className="flex items-center justify-between gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Input
            value={name}
            autoFocus
            aria-label="Category name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={updateCategory.isPending}>
              Save
            </Button>
            <Button size="sm" type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2">
        <span className={isArchived ? "text-muted-foreground line-through" : undefined}>
          {category.name}
        </span>
        {isArchived && <Badge variant="muted">Archived</Badge>}
      </span>

      <div className="flex gap-2">
        {isArchived ? (
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
        <p role="status" className="text-sm text-muted-foreground">
          Loading categories…
        </p>
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
