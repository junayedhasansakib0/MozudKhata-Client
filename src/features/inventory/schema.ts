import { z } from "zod";

/**
 * Client-side inventory form schemas. These mirror the server's validation
 * (docs/api.md §Phase 04) for fast feedback; the backend remains authoritative.
 * Quantity is never set here — stock changes go through the stock service.
 */

// A non-negative number with up to 3 decimal places, entered as text.
const thresholdField = z
  .string()
  .trim()
  .refine((s) => s === "" || /^\d{1,9}(\.\d{1,3})?$/.test(s), {
    message: "Enter a non-negative number (up to 3 decimals).",
  });

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200, "Name is too long."),
  sku: z.string().trim().max(64, "SKU is too long."),
  unit: z.string().trim().max(16, "Unit is too long."),
  categoryId: z.string(), // "" means uncategorized
  lowStockThreshold: thresholdField,
  description: z.string().trim().max(2000, "Description is too long."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Stock movement form (docs/api.md §Phase 05). Mirrors the server rules
 * (stock/math.ts `signedDelta`) for fast feedback: IN/OUT/DAMAGED_LOST take a
 * magnitude > 0, an ADJUSTMENT takes a non-zero signed correction. The backend
 * remains authoritative (it also enforces the no-negative-stock invariant).
 */
export const movementFormSchema = z
  .object({
    type: z.enum(["IN", "OUT", "ADJUSTMENT", "DAMAGED_LOST"]),
    quantity: z.string().trim().min(1, "Quantity is required."),
    reason: z.string().trim().max(500, "Reason is too long."),
  })
  .superRefine((v, ctx) => {
    if (!/^-?\d{1,9}(\.\d{1,3})?$/.test(v.quantity)) {
      ctx.addIssue({
        path: ["quantity"],
        code: z.ZodIssueCode.custom,
        message: "Enter a number (up to 3 decimals).",
      });
      return;
    }
    const n = Number(v.quantity);
    if (v.type === "ADJUSTMENT") {
      if (n === 0) {
        ctx.addIssue({
          path: ["quantity"],
          code: z.ZodIssueCode.custom,
          message: "Adjustment must not be zero.",
        });
      }
    } else if (n <= 0) {
      ctx.addIssue({
        path: ["quantity"],
        code: z.ZodIssueCode.custom,
        message: "Enter a quantity greater than zero.",
      });
    }
  });

export type MovementFormValues = z.infer<typeof movementFormSchema>;
