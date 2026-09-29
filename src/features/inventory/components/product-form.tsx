import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import type { ProductInput } from "../api";
import { useCategories, useCreateProduct, useUpdateProduct } from "../hooks";
import { productFormSchema, type ProductFormValues } from "../schema";
import type { Product } from "../types";

/**
 * Create/edit form for a product. Quantity is intentionally absent — stock
 * changes go through the stock service, never product CRUD (AGENTS.md §1).
 */
export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      unit: product?.unit ?? "",
      categoryId: product?.categoryId ?? "",
      lowStockThreshold: product?.lowStockThreshold ?? "",
      description: product?.description ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const input: ProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim() ? values.sku.trim() : null,
      unit: values.unit.trim() ? values.unit.trim() : undefined,
      categoryId: values.categoryId ? values.categoryId : null,
      lowStockThreshold: values.lowStockThreshold.trim() ? values.lowStockThreshold.trim() : undefined,
      description: values.description.trim() ? values.description.trim() : null,
    };

    const saved =
      product !== undefined
        ? await updateProduct.mutateAsync({ id: product.id, input })
        : await createProduct.mutateAsync(input);
    navigate(`/products/${saved.id}`, { replace: true });
  });

  const mutationError = (isEdit ? updateProduct.error : createProduct.error) ?? null;
  const rootError =
    mutationError instanceof ApiError
      ? mutationError.message
      : mutationError
        ? "Something went wrong."
        : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU (optional)</Label>
          <Input id="sku" aria-invalid={Boolean(errors.sku)} aria-describedby={errors.sku ? "sku-error" : undefined} {...register("sku")} />
          {errors.sku && (
            <p id="sku-error" className="text-sm text-destructive">
              {errors.sku.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit (optional)</Label>
          <Input id="unit" placeholder="pcs" aria-invalid={Boolean(errors.unit)} aria-describedby={errors.unit ? "unit-error" : undefined} {...register("unit")} />
          {errors.unit && (
            <p id="unit-error" className="text-sm text-destructive">
              {errors.unit.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? "categoryId-error" : undefined} {...register("categoryId")}>
            <option value="">Uncategorized</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && (
            <p id="categoryId-error" className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lowStockThreshold">Low-stock threshold (optional)</Label>
          <Input
            id="lowStockThreshold"
            inputMode="decimal"
            placeholder="0"
            aria-invalid={Boolean(errors.lowStockThreshold)}
            aria-describedby={errors.lowStockThreshold ? "lowStockThreshold-error" : "lowStockThreshold-hint"}
            {...register("lowStockThreshold")}
          />
          {errors.lowStockThreshold ? (
            <p id="lowStockThreshold-error" className="text-sm text-destructive">
              {errors.lowStockThreshold.message}
            </p>
          ) : (
            <p id="lowStockThreshold-hint" className="text-xs text-muted-foreground">
              Stock at or below this counts as low.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {rootError && (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
