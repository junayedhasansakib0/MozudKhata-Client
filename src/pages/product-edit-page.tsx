import { Link, useParams } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button-variants";
import { ProductForm } from "@/features/inventory/components/product-form";
import { useProduct } from "@/features/inventory/hooks";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, error } = useProduct(id);

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

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <Link
          to={`/products/${product.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to product
        </Link>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <ProductForm product={product} />
      </div>
    </section>
  );
}
