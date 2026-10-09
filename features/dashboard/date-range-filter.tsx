"use client";

import type { DateRangeKey } from "@/lib/data/repositories";
import { cn } from "@/lib/utils";

const RANGES: { value: DateRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

interface DateRangeFilterProps {
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex items-center rounded-md border border-border bg-card p-0.5"
    >
      {RANGES.map((range) => {
        const active = range.value === value;
        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(range.value)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
