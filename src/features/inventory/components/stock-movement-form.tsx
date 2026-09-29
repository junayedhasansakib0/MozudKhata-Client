import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, describeApiError } from "@/lib/api";
import type { MovementInput } from "../api";
import { useRecordMovement } from "../hooks";
import { movementFormSchema, type MovementFormValues } from "../schema";
import type { MovementType, Product } from "../types";

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "IN", label: "Stock in" },
  { value: "OUT", label: "Stock out" },
  { value: "ADJUSTMENT", label: "Adjustment (±)" },
  { value: "DAMAGED_LOST", label: "Damaged / lost" },
];

// Types that reduce stock — we can pre-check the magnitude against what's on hand.
const REDUCING: ReadonlySet<MovementType> = new Set(["OUT", "DAMAGED_LOST"]);

/**
 * Records a stock movement for a product through the stock service (ADR-004);
 * the form never writes quantity directly. A client-side guardrail flags an
 * OUT/DAMAGED_LOST that exceeds the quantity on hand, but the server stays
 * authoritative and returns 409 if stock changed underneath us.
 */
export function StockMovementForm({ product }: { product: Product }) {
  const recordMovement = useRecordMovement(product.id);
  const available = Number(product.quantity);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { type: "IN", quantity: "", reason: "" },
  });

  const type = watch("type");

  const onSubmit = handleSubmit(async (values) => {
    const magnitude = Number(values.quantity);
    if (REDUCING.has(values.type) && magnitude > available) {
      setError("quantity", {
        message: `Only ${product.quantity} ${product.unit} on hand.`,
      });
      return;
    }

    const input: MovementInput = {
      type: values.type,
      quantity: values.quantity.trim(),
      reason: values.reason.trim() ? values.reason.trim() : null,
    };
    await recordMovement.mutateAsync(input);
    reset({ type: values.type, quantity: "", reason: "" });
  });

  const error = recordMovement.error;
  const rootError =
    error instanceof ApiError ? describeApiError(error) : error ? "Something went wrong." : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="movement-type">Movement type</Label>
          <Select id="movement-type" {...register("type")}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="movement-quantity">Quantity ({product.unit})</Label>
          <Input
            id="movement-quantity"
            inputMode="decimal"
            placeholder={type === "ADJUSTMENT" ? "e.g. -3 or 5" : "0"}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "movement-quantity-error" : "movement-quantity-hint"}
            {...register("quantity")}
          />
          {errors.quantity ? (
            <p id="movement-quantity-error" className="text-sm text-destructive">
              {errors.quantity.message}
            </p>
          ) : (
            <p id="movement-quantity-hint" className="text-xs text-muted-foreground">
              {type === "ADJUSTMENT"
                ? "Signed correction — negative lowers the count."
                : "Amount to add or remove."}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="movement-reason">Reason (optional)</Label>
        <Textarea
          id="movement-reason"
          rows={2}
          placeholder="Why this movement happened"
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? "movement-reason-error" : undefined}
          {...register("reason")}
        />
        {errors.reason && (
          <p id="movement-reason-error" className="text-sm text-destructive">
            {errors.reason.message}
          </p>
        )}
      </div>

      {rootError && (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Recording…" : "Record movement"}
      </Button>
    </form>
  );
}
