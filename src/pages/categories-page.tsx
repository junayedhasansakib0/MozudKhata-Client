import { Link } from "react-router-dom";
import { CategoryManager } from "@/features/inventory/components/category-manager";

export function CategoriesPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to products
        </Link>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <CategoryManager />
      </div>
    </section>
  );
}
