import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { StockStatusBadge } from "@/features/inventory/components/stock-status-badge";
import { useProducts } from "@/features/inventory/hooks";

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useProducts({ page, pageSize: PAGE_SIZE });

  const meta = data?.meta;
  const products = data?.products ?? [];

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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load products."}
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
          <p className="text-sm text-muted-foreground">
            No products yet.{" "}
            <Link to="/products/new" className="font-medium text-primary hover:underline">
              Add your first product
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 text-right font-medium">Quantity</th>
                <th className="px-4 py-2 font-medium">Status</th>
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
