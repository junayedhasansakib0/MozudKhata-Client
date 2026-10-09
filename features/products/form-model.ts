import type { Product, ProductInput, ProductStatus, VariantInput } from "@/lib/data/types";

/**
 * Form-side working model for the product create/edit sheet. Numeric fields are kept
 * as strings for controlled inputs and converted to minor units on submit.
 */
export interface VariantDraft {
  id?: string;
  variantName: string;
  sku: string;
  barcode: string;
  costMajor: string;
  sellMajor: string;
  unit: string;
  attributes: Record<string, string>;
  reorderThreshold: string;
  reorderQuantity: string;
  status: ProductStatus;
}

export interface ProductDraft {
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  taxRateId: string;
  status: ProductStatus;
  variants: VariantDraft[];
}

export function blankVariant(partial: Partial<VariantDraft> = {}): VariantDraft {
  return {
    variantName: "Default",
    sku: "",
    barcode: "",
    costMajor: "",
    sellMajor: "",
    unit: "each",
    attributes: {},
    reorderThreshold: "10",
    reorderQuantity: "24",
    status: "active",
    ...partial,
  };
}

export function blankProductDraft(defaults: { categoryId: string; taxRateId: string }): ProductDraft {
  return {
    name: "",
    description: "",
    categoryId: defaults.categoryId,
    brandId: "",
    taxRateId: defaults.taxRateId,
    status: "active",
    variants: [blankVariant()],
  };
}

function majorFromMinor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description ?? "",
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    taxRateId: product.taxRateId ?? "",
    status: product.status,
    variants: product.variants.map((v) => ({
      id: v.id,
      variantName: v.variantName,
      sku: v.sku,
      barcode: v.barcode ?? "",
      costMajor: majorFromMinor(v.costPrice.amountMinor),
      sellMajor: majorFromMinor(v.sellPrice.amountMinor),
      unit: v.unit,
      attributes: { ...v.attributes },
      reorderThreshold: String(v.reorderThreshold),
      reorderQuantity: String(v.reorderQuantity),
      status: v.status,
    })),
  };
}

function toMinor(major: string): number {
  const n = Number(major);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function toInt(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function draftToInput(draft: ProductDraft): ProductInput {
  const variants: VariantInput[] = draft.variants.map((v) => ({
    id: v.id,
    sku: v.sku.trim(),
    barcode: v.barcode.trim() || undefined,
    variantName: v.variantName.trim() || "Default",
    costPriceMinor: toMinor(v.costMajor),
    sellPriceMinor: toMinor(v.sellMajor),
    unit: v.unit.trim() || "each",
    attributes: v.attributes,
    reorderThreshold: toInt(v.reorderThreshold),
    reorderQuantity: toInt(v.reorderQuantity),
    status: v.status,
  }));
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    categoryId: draft.categoryId,
    brandId: draft.brandId || undefined,
    taxRateId: draft.taxRateId || undefined,
    status: draft.status,
    variants,
  };
}

export interface DraftValidation {
  ok: boolean;
  errors: string[];
}

/** Client-side validation mirroring backend intent (docs/business-rules.md). */
export function validateDraft(draft: ProductDraft): DraftValidation {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Product name is required.");
  if (!draft.categoryId) errors.push("Category is required.");
  if (draft.variants.length === 0) errors.push("At least one variant is required.");

  const skus = new Set<string>();
  draft.variants.forEach((v, i) => {
    const label = v.variantName.trim() || `Variant ${i + 1}`;
    if (!v.sku.trim()) errors.push(`${label}: SKU is required.`);
    else {
      const key = v.sku.trim().toLowerCase();
      if (skus.has(key)) errors.push(`${label}: duplicate SKU "${v.sku}".`);
      skus.add(key);
    }
    if (v.sellMajor === "" || Number(v.sellMajor) < 0 || Number.isNaN(Number(v.sellMajor))) {
      errors.push(`${label}: sell price must be a number ≥ 0.`);
    }
    if (v.costMajor !== "" && (Number(v.costMajor) < 0 || Number.isNaN(Number(v.costMajor)))) {
      errors.push(`${label}: cost price must be a number ≥ 0.`);
    }
  });

  return { ok: errors.length === 0, errors };
}
