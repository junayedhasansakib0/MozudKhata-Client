import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementHistory } from "@/features/inventory/components/movement-history";
import { StockMovementForm } from "@/features/inventory/components/stock-movement-form";
import { StockStatusBadge } from "@/features/inventory/components/stock-status-badge";
import {
  useArchiveProduct,
  useProduct,
  useRestoreProduct,
} from "@/features/inventory/hooks";

/** Read-only product detail with edit and archive/restore actions. */
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, error } = useProduct(id);
  const archiveProduct = useArchiveProduct();
  const restoreProduct = useRestoreProduct();

  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading product…
      </p>
    );
  }

  if (isError || !product) {
    return (
      <section className="space-y-4">
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Product not found."}
        </p>
        <Link to="/products" className={buttonVariants({ variant: "outline" })}>
          Back to products
        </Link>
      </section>
    );
  }

  const isArchived = product.archivedAt !== null;

  const fields: { label: string; value: string }[] = [
    { label: "SKU", value: product.sku ?? "—" },
    { label: "Category", value: product.category?.name ?? "Uncategorized" },
    { label: "Quantity", value: `${product.quantity} ${product.unit}` },
    { label: "Low-stock threshold", value: `${product.lowStockThreshold} ${product.unit}` },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <StockStatusBadge status={product.stockStatus} />
          </div>
          <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to products
          </Link>
        </div>
        <div className="flex gap-2">
          <Link to={`/products/${product.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit
          </Link>
          {isArchived ? (
            <Button
              variant="outline"
              onClick={() => restoreProduct.mutate(product.id)}
              disabled={restoreProduct.isPending}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={async () => {
                await archiveProduct.mutateAsync(product.id);
                navigate("/products");
              }}
              disabled={archiveProduct.isPending}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      <dl className="grid gap-4 rounded-lg border bg-card p-6 text-card-foreground sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.label}
            </dt>
            <dd className="text-sm tabular-nums">{f.value}</dd>
          </div>
        ))}
        {product.description && (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </dt>
            <dd className="whitespace-pre-wrap text-sm">{product.description}</dd>
          </div>
        )}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record stock movement</CardTitle>
          </CardHeader>
          <CardContent>
            {isArchived ? (
              <p className="text-sm text-muted-foreground">
                Restore this product to record stock movements.
              </p>
            ) : (
              <StockMovementForm product={product} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movement history</CardTitle>
          </CardHeader>
          <CardContent>
            <MovementHistory product={product} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
