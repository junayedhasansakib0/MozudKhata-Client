"use client";

import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Brand, Category, ProductSortKey, ProductStatus } from "@/lib/data/types";

export interface ProductFilterValues {
  q: string;
  categoryId: string;
  brandId: string;
  status: ProductStatus | "all";
  sort: ProductSortKey;
}

export const DEFAULT_FILTERS: ProductFilterValues = {
  q: "",
  categoryId: "",
  brandId: "",
  status: "all",
  sort: "-created",
};

interface ProductFiltersProps {
  values: ProductFilterValues;
  categories: Category[];
  brands: Brand[];
  onChange: (patch: Partial<ProductFilterValues>) => void;
  onClear: () => void;
}

const SORTS: { value: ProductSortKey; label: string }[] = [
  { value: "-created", label: "Newest" },
  { value: "created", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "-sell", label: "Price high–low" },
  { value: "sell", label: "Price low–high" },
  { value: "-stock", label: "Stock high–low" },
  { value: "stock", label: "Stock low–high" },
];

export function ProductFilters({
  values,
  categories,
  brands,
  onChange,
  onClear,
}: ProductFiltersProps) {
  const dirty =
    values.q !== "" ||
    values.categoryId !== "" ||
    values.brandId !== "" ||
    values.status !== "all" ||
    values.sort !== DEFAULT_FILTERS.sort;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search by name, SKU, barcode, or brand…"
          className="bg-muted pl-9"
          aria-label="Search catalog"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          value={values.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          aria-label="Filter by category"
          className="w-auto"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.productCount})
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={values.brandId}
          onChange={(e) => onChange({ brandId: e.target.value })}
          aria-label="Filter by brand"
          className="w-auto"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={values.status}
          onChange={(e) => onChange({ status: e.target.value as ProductStatus | "all" })}
          aria-label="Filter by status"
          className="w-auto"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </NativeSelect>
        <NativeSelect
          value={values.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductSortKey })}
          aria-label="Sort products"
          className="w-auto"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        {dirty ? (
          <Button variant="ghost" size="icon" onClick={onClear} title="Clear filters" aria-label="Clear filters">
            <FilterX className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
