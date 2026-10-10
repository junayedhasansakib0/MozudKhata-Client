"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Eye, Pencil, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Money, Product, ProductVariant } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  costRangeMinor,
  marginPct,
  productAvgMarginPct,
  productStock,
  productStockLevel,
  sellRangeMinor,
  variantStock,
} from "./catalog-math";

function money(minor: number, currency: string): string {
  return formatMoney({ amountMinor: minor, currency } satisfies Money);
}

function priceRange(min: number, max: number, currency: string): string {
  return min === max ? money(min, currency) : `${money(min, currency)} – ${money(max, currency)}`;
}

function StockBadge({ product }: { product: Product }) {
  const level = productStockLevel(product);
  if (level === "out") return <Badge variant="destructive">Out of stock</Badge>;
  if (level === "low") return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}

function StockCell({ product }: { product: Product }) {
  const total = productStock(product);
  const perStore = React.useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const variant of product.variants) {
      for (const row of variant.stockByStore) {
        const entry = map.get(row.storeId) ?? { name: row.storeName, qty: 0 };
        entry.qty += row.quantity;
        map.set(row.storeId, entry);
      }
    }
    return [...map.values()];
  }, [product]);
  const segColors = ["bg-primary", "bg-primary/60", "bg-info/60", "bg-muted-foreground/40"];
  return (
    <div className="flex min-w-[180px] flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-headline-sm font-display font-semibold tabular-nums text-foreground">
          {total} <span className="text-xs font-normal text-muted-foreground">units</span>
        </span>
        <StockBadge product={product} />
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {perStore.map((s, i) =>
          total > 0 && s.qty > 0 ? (
            <div
              key={s.name}
              className={cn("h-full", segColors[i % segColors.length])}
              style={{ width: `${(s.qty / total) * 100}%` }}
              title={`${s.name}: ${s.qty}`}
            />
          ) : null,
        )}
      </div>
      <div className="text-label-sm flex flex-wrap items-center gap-x-2 text-muted-foreground">
        {perStore.map((s) => (
          <span key={s.name} className="tabular-nums">
            {s.name.split(" ")[0]}: {s.qty}
          </span>
        ))}
      </div>
    </div>
  );
}

function VariantSubRow({ variant }: { variant: ProductVariant }) {
  const currency = variant.sellPrice.currency;
  const stock = variantStock(variant);
  const margin = marginPct(variant.costPrice.amountMinor, variant.sellPrice.amountMinor);
  return (
    <TableRow className="bg-muted/30">
      <TableCell />
      <TableCell>
        <div className="flex items-center gap-2 ps-9">
          <span
            className={cn(
              "size-2 rounded-full",
              variant.status === "active" ? "bg-success" : "bg-muted-foreground/40",
            )}
          />
          <span className="text-sm font-medium text-foreground">{variant.variantName}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-code-sku flex flex-col font-mono">
          <span className="font-medium text-foreground">{variant.sku}</span>
          <span className="text-[11px] text-muted-foreground">
            {variant.barcode ?? "No barcode"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-label-sm text-center text-muted-foreground">
        {variant.unit}
      </TableCell>
      <TableCell className="text-code-sku text-end font-mono text-muted-foreground">
        {money(variant.costPrice.amountMinor, currency)}
      </TableCell>
      <TableCell className="text-end">
        <div className="flex items-center justify-end gap-2">
          <span className="font-semibold tabular-nums text-foreground">
            {money(variant.sellPrice.amountMinor, currency)}
          </span>
          <Badge variant="success">{margin.toFixed(1)}%</Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm tabular-nums text-foreground">{stock} units</span>
      </TableCell>
      <TableCell className="text-center">
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            variant.status === "active" ? "bg-success" : "bg-muted-foreground/40",
          )}
        />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

interface ProductRowProps {
  product: Product;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function ProductRow({
  product,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onToggleStatus,
}: ProductRowProps) {
  const [expanded, setExpanded] = React.useState(false);
  const currency = product.variants[0]?.sellPrice.currency ?? "USD";
  const sell = sellRangeMinor(product);
  const cost = costRangeMinor(product);

  return (
    <>
      <TableRow data-state={selected ? "selected" : undefined}>
        <TableCell>
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${product.name}`}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            {product.isVariable ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-md bg-muted p-1 text-primary transition-colors hover:bg-muted/80"
                aria-label={expanded ? "Collapse variants" : "Expand variants"}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <div className="flex min-w-0 flex-col">
              <button
                type="button"
                onClick={onView}
                className="truncate text-start text-sm font-semibold text-foreground hover:text-primary"
              >
                {product.name}
              </button>
              <div className="mt-0.5 flex items-center gap-2">
                {product.brandName ? (
                  <span className="text-label-sm text-muted-foreground">{product.brandName}</span>
                ) : null}
                <Badge variant="secondary">{product.categoryName}</Badge>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-code-sku flex flex-col font-mono">
            <span className="font-semibold text-foreground">{product.variants[0]?.sku}</span>
            <span className="text-[11px] text-muted-foreground">
              {product.isVariable
                ? `${product.variants.length} scannable codes`
                : (product.variants[0]?.barcode ?? "No barcode")}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          {product.isVariable ? (
            <Badge variant="info">{product.variants.length} variants</Badge>
          ) : (
            <Badge variant="secondary">Single item</Badge>
          )}
        </TableCell>
        <TableCell className="text-code-sku text-end font-mono text-muted-foreground">
          {priceRange(cost.min, cost.max, currency)}
        </TableCell>
        <TableCell className="text-end">
          <div className="flex flex-col items-end">
            <span className="text-headline-sm font-display font-semibold tabular-nums text-foreground">
              {priceRange(sell.min, sell.max, currency)}
            </span>
            <span className="text-label-sm font-semibold text-success">
              {productAvgMarginPct(product).toFixed(1)}% margin
            </span>
          </div>
        </TableCell>
        <TableCell>
          <StockCell product={product} />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.status === "active"}
            onCheckedChange={onToggleStatus}
            aria-label={`${product.name} is ${product.status}`}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-0.5 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onView}
              title="View details"
              aria-label="View details"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onEdit}
              title="Edit product"
              aria-label="Edit product"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Print barcode label"
              aria-label="Print barcode label"
              disabled
            >
              <QrCode className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && product.isVariable
        ? product.variants.map((variant) => <VariantSubRow key={variant.id} variant={variant} />)
        : null}
    </>
  );
}

interface ProductsTableProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

const PAGE_SIZES = [25, 50, 100];

export function ProductsTable({
  products,
  total,
  page,
  pageSize,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleStatus,
}: ProductsTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageIds = products.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={onToggleAll}
                aria-label="Select all on this page"
              />
            </TableHead>
            <TableHead className="min-w-[260px]">Product</TableHead>
            <TableHead className="min-w-[160px]">SKU &amp; barcode</TableHead>
            <TableHead className="text-center">Structure</TableHead>
            <TableHead className="text-end">Cost</TableHead>
            <TableHead className="min-w-[150px] text-end">Sell &amp; margin</TableHead>
            <TableHead className="min-w-[180px]">Stock across stores</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              selected={selectedIds.has(product.id)}
              onToggleSelect={() => onToggleSelect(product.id)}
              onView={() => onView(product)}
              onEdit={() => onEdit(product)}
              onToggleStatus={() => onToggleStatus(product)}
            />
          ))}
        </TableBody>
      </Table>

      <div className="text-label-md flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/30 p-3 text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            Showing {from}–{to} of {total}
          </span>
          <NativeSelect
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-8 w-auto py-0"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="px-3 tabular-nums text-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
