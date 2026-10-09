"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertCircle, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toUserMessage } from "@/lib/data/errors";
import type { Brand, Category, Product, TaxRateConfig } from "@/lib/data/types";
import { marginPct } from "./catalog-math";
import {
  blankProductDraft,
  draftFromProduct,
  draftToInput,
  validateDraft,
  type ProductDraft,
  type VariantDraft,
} from "./form-model";
import { useProductMutations } from "./use-products";
import { VariantMatrixEditor } from "./variant-matrix-editor";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  taxRates: TaxRateConfig[];
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
  brands,
  taxRates,
}: ProductFormSheetProps) {
  const { create, update } = useProductMutations();
  const defaults = {
    categoryId: categories[0]?.id ?? "",
    taxRateId: taxRates[0]?.id ?? "",
  };
  const [draft, setDraft] = React.useState<ProductDraft>(() =>
    product ? draftFromProduct(product) : blankProductDraft(defaults),
  );
  const [tab, setTab] = React.useState("basic");
  const [errors, setErrors] = React.useState<string[]>([]);

  const pending = create.isPending || update.isPending;

  function patch(patch: Partial<ProductDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function setVariants(variants: VariantDraft[]) {
    setDraft((prev) => ({ ...prev, variants }));
  }

  async function handleSave() {
    const validation = validateDraft(draft);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    const input = draftToInput(draft);
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, input });
        toast.success("Product updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Product created");
      }
      onOpenChange(false);
    } catch (error) {
      setErrors([toUserMessage(error)]);
    }
  }

  const baseSku = draft.variants[0]?.sku ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border bg-muted/40 p-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <SheetTitle>{product ? "Edit product" : "Create product"}</SheetTitle>
              <SheetDescription>Central master catalog entry.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0 px-5">
            <TabsTrigger value="basic">Basic info</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {errors.length > 0 ? (
              <div className="mb-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <ul className="space-y-0.5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <TabsContent value="basic">
              <BasicInfoTab draft={draft} patch={patch} categories={categories} brands={brands} />
            </TabsContent>
            <TabsContent value="variants">
              <VariantMatrixEditor baseSku={baseSku} variants={draft.variants} onChange={setVariants} />
            </TabsContent>
            <TabsContent value="inventory">
              <InventoryTab variants={draft.variants} onChange={setVariants} />
            </TabsContent>
            <TabsContent value="taxes">
              <TaxesTab draft={draft} patch={patch} taxRates={taxRates} />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-label-sm uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function BasicInfoTab({
  draft,
  patch,
  categories,
  brands,
}: {
  draft: ProductDraft;
  patch: (p: Partial<ProductDraft>) => void;
  categories: Category[];
  brands: Brand[];
}) {
  return (
    <div className="space-y-4">
      <Field label="Product name *" htmlFor="product-name">
        <Input
          id="product-name"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Mozud Heritage Ceramic Tumbler"
        />
      </Field>
      <Field label="Description" htmlFor="product-description">
        <Textarea
          id="product-description"
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Short product description shown on receipts and listings."
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category *" htmlFor="product-category">
          <NativeSelect
            id="product-category"
            value={draft.categoryId}
            onChange={(e) => patch({ categoryId: e.target.value })}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Brand" htmlFor="product-brand">
          <NativeSelect
            id="product-brand"
            value={draft.brandId}
            onChange={(e) => patch({ brandId: e.target.value })}
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Status" htmlFor="product-status">
        <NativeSelect
          id="product-status"
          value={draft.status}
          onChange={(e) => patch({ status: e.target.value as ProductDraft["status"] })}
          className="sm:w-48"
        >
          <option value="active">Active (sellable on POS)</option>
          <option value="inactive">Inactive (hidden from sales)</option>
        </NativeSelect>
      </Field>
    </div>
  );
}

function InventoryTab({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}) {
  function patchVariant(index: number, p: Partial<VariantDraft>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...p } : v)));
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Reorder thresholds drive low-stock alerts and reorder drafts (per variant).
      </p>
      {variants.map((variant, index) => (
        <div key={variant.id ?? index} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-sm font-semibold text-foreground">{variant.variantName || `Variant ${index + 1}`}</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Field label="Unit">
              <Input
                value={variant.unit}
                onChange={(e) => patchVariant(index, { unit: e.target.value })}
                placeholder="each"
              />
            </Field>
            <Field label="Low-stock level">
              <Input
                value={variant.reorderThreshold}
                onChange={(e) => patchVariant(index, { reorderThreshold: e.target.value })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
            <Field label="Reorder quantity">
              <Input
                value={variant.reorderQuantity}
                onChange={(e) => patchVariant(index, { reorderQuantity: e.target.value })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaxesTab({
  draft,
  patch,
  taxRates,
}: {
  draft: ProductDraft;
  patch: (p: Partial<ProductDraft>) => void;
  taxRates: TaxRateConfig[];
}) {
  const first = draft.variants[0];
  const margin = first ? marginPct(Number(first.costMajor) * 100, Number(first.sellMajor) * 100) : 0;
  return (
    <div className="space-y-4">
      <Field label="Tax class" htmlFor="product-tax">
        <NativeSelect
          id="product-tax"
          value={draft.taxRateId}
          onChange={(e) => patch({ taxRateId: e.target.value })}
        >
          <option value="">Default tax rate</option>
          {taxRates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
        <span className="text-muted-foreground">Estimated gross margin (first variant): </span>
        <span className="font-semibold text-success">{Number.isFinite(margin) ? margin.toFixed(1) : "0.0"}%</span>
      </div>
    </div>
  );
}
