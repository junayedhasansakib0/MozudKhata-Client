"use client";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Money, Product } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { marginPct, productStock, variantStock } from "./catalog-math";

function money(minor: number, currency: string): string {
  return formatMoney({ amountMinor: minor, currency } satisfies Money);
}

interface ProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

export function ProductDetailSheet({ open, onOpenChange, product, onEdit }: ProductDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {product ? (
          <>
            <SheetHeader className="border-b border-border bg-muted/40 p-5 text-start">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <SheetTitle>{product.name}</SheetTitle>
                  <SheetDescription>
                    {product.brandName ? `${product.brandName} · ` : ""}
                    {product.categoryName}
                  </SheetDescription>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant={product.status === "active" ? "success" : "secondary"}>
                      {product.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="info">
                      {product.isVariable ? `${product.variants.length} variants` : "Single item"}
                    </Badge>
                    <span className="text-label-sm text-muted-foreground tabular-nums">
                      {productStock(product)} units on hand
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => onEdit(product)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {product.description ? (
                <p className="mb-4 text-sm text-muted-foreground">{product.description}</p>
              ) : null}

              <h3 className="mb-2 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Variants &amp; stock
              </h3>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-end">Cost</TableHead>
                      <TableHead className="text-end">Sell</TableHead>
                      <TableHead className="text-end">Margin</TableHead>
                      <TableHead className="text-end">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant) => {
                      const currency = variant.sellPrice.currency;
                      return (
                        <TableRow key={variant.id}>
                          <TableCell className="text-sm font-medium text-foreground">
                            {variant.variantName}
                          </TableCell>
                          <TableCell className="font-mono text-code-sku text-muted-foreground">
                            {variant.sku}
                            <span className="block text-[11px]">{variant.barcode ?? "No barcode"}</span>
                          </TableCell>
                          <TableCell className="text-end font-mono text-code-sku text-muted-foreground">
                            {money(variant.costPrice.amountMinor, currency)}
                          </TableCell>
                          <TableCell className="text-end font-semibold tabular-nums">
                            {money(variant.sellPrice.amountMinor, currency)}
                          </TableCell>
                          <TableCell className="text-end">
                            <Badge variant="success">
                              {marginPct(
                                variant.costPrice.amountMinor,
                                variant.sellPrice.amountMinor,
                              ).toFixed(1)}
                              %
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end tabular-nums">{variantStock(variant)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <h3 className="mb-2 mt-5 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stock by store
              </h3>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <span className="text-sm font-medium text-foreground">{variant.variantName}</span>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-label-sm text-muted-foreground">
                      {variant.stockByStore.map((row) => (
                        <span key={row.storeId} className="tabular-nums">
                          {row.storeName}: <span className="text-foreground">{row.quantity}</span>
                          {row.binLocation ? ` · ${row.binLocation}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
