import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StockStatusBadge } from "@/features/inventory/components/stock-status-badge";
import { useCategories, useProducts } from "@/features/inventory/hooks";
import type { ProductSort, SortOrder, StockStatus } from "@/features/inventory/types";

const PAGE_SIZE = 20;

/** Debounce a fast-changing value (e.g. the search box) to avoid a request per keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const SORT_OPTIONS: { value: `${ProductSort}:${SortOrder}`; label: string }[] = [
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "quantity:desc", label: "Quantity (high → low)" },
  { value: "quantity:asc", label: "Quantity (low → high)" },
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "createdAt:desc", label: "Newest" },
];

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW", label: "Low" },
  { value: "OUT", label: "Out of stock" },
];

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus | "">("");
  const [sortKey, setSortKey] = useState<`${ProductSort}:${SortOrder}`>("name:asc");

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [sort, order] = sortKey.split(":") as [ProductSort, SortOrder];

  // Any filter/sort change resets to the first page so results stay coherent.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, stockStatus, sortKey]);

  const { data: categories } = useCategories();

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
      stockStatus: stockStatus || undefined,
      sort,
      order,
    }),
    [page, debouncedSearch, categoryId, stockStatus, sort, order],
  );

  const { data, isLoading, isError, error } = useProducts(params);

  const meta = data?.meta;
  const products = data?.products ?? [];
  const hasFilters = Boolean(debouncedSearch || categoryId || stockStatus);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Your inventory catalogue.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/categories" className={buttonVariants({ variant: "outline" })}>
            Categories
          </Link>
          <Link to="/products/new" className={buttonVariants()}>
            New product
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="product-search">Search</Label>
          <Input
            id="product-search"
            type="search"
            placeholder="Name or SKU"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-category">Category</Label>
          <Select
            id="product-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-status">Stock status</Label>
          <Select
            id="product-status"
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value as StockStatus | "")}
          >
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-sort">Sort by</Label>
          <Select
            id="product-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as `${ProductSort}:${SortOrder}`)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading products…
        </p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load products."}
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
          <p className="text-sm text-muted-foreground">
            {hasFilters ? (
              "No products match these filters."
            ) : (
              <>
                No products yet.{" "}
                <Link to="/products/new" className="font-medium text-primary hover:underline">
                  Add your first product
                </Link>
                .
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Name</th>
                <th scope="col" className="px-4 py-2 font-medium">SKU</th>
                <th scope="col" className="px-4 py-2 font-medium">Category</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Quantity</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link to={`/products/${p.id}`} className="font-medium text-primary hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.sku ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="px-4 py-2">
                    <StockStatusBadge status={p.stockStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} products
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
