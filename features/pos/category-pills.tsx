"use client";

import type { ReactNode } from "react";

import type { PosCategory } from "@/lib/data/types";
import { cn } from "@/lib/utils";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/80 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

interface CategoryPillsProps {
  categories: PosCategory[];
  total: number;
  active: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryPills({ categories, total, active, onChange }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill active={active === null} onClick={() => onChange(null)}>
        All Items
        <span className="text-xs opacity-70">{total}</span>
      </Pill>
      {categories.map((category) => (
        <Pill
          key={category.id}
          active={active === category.id}
          onClick={() => onChange(category.id)}
        >
          {category.name}
          <span className="text-xs opacity-70">{category.count}</span>
        </Pill>
      ))}
    </div>
  );
}
