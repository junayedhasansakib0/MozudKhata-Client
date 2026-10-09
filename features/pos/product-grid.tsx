"use client";

import { PackageSearch, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import type { PosProduct } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge variant="destructive">Out</Badge>;
  if (stock <= 10) return <Badge variant="warning">{stock} left</Badge>;
  return <span className="text-xs text-muted-foreground">{stock} in stock</span>;
}

function ProductTile({ product, onAdd }: { product: PosProduct; onAdd: (p: PosProduct) => void }) {
  const outOfStock = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      className={cn(
        "flex min-h-[7rem] flex-col rounded-lg border border-border bg-card p-3 text-start transition-colors",
        outOfStock ? "cursor-not-allowed opacity-60" : "hover:border-primary/40 hover:bg-muted",
        product.stock > 0 && product.stock <= 10 ? "ring-1 ring-warning/40" : null,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{product.sku}</span>
        <StockBadge stock={product.stock} />
      </div>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm font-medium text-foreground">
        {product.name}
      </p>
      <p className="text-xs text-muted-foreground">{product.categoryName}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatMoney(product.price)}
        </span>
        {outOfStock ? null : (
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </span>
        )}
      </div>
    </button>
  );
}

interface ProductGridProps {
  products: PosProduct[];
  onAdd: (product: PosProduct) => void;
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try a different search or category."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductTile key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}
