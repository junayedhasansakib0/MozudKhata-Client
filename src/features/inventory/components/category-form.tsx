import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useCreateCategory } from "../hooks";
import { categoryFormSchema, type CategoryFormValues } from "../schema";

/** Inline form to add a category by name. Resets on success. */
export function CategoryForm() {
  const createCategory = useCreateCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createCategory.mutateAsync({ name: values.name.trim() });
    reset({ name: "" });
  });

  const rootError =
    createCategory.error instanceof ApiError
      ? createCategory.error.message
      : createCategory.error
        ? "Something went wrong."
        : null;

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="category-name">New category</Label>
        <div className="flex gap-2">
          <Input
            id="category-name"
            aria-invalid={Boolean(errors.name)}
            placeholder="e.g. Beverages"
            {...register("name")}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add"}
          </Button>
        </div>
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        {rootError && (
          <p role="alert" className="text-sm text-destructive">
            {rootError}
          </p>
        )}
      </div>
    </form>
  );
}
