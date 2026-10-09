import { z } from "zod";

export const businessStepSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  country: z.string().min(1, "Select a country"),
  industry: z.string().optional(),
});

export const storeStepSchema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  storeCode: z.string().min(1, "Store code is required"),
  city: z.string().min(1, "City is required"),
});

export const currencyStepSchema = z.object({
  baseCurrency: z.string().min(1, "Select a base currency"),
});

export const taxStepSchema = z
  .object({
    taxEnabled: z.boolean(),
    taxName: z.string().optional(),
    taxRate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.taxEnabled) return;
    if (!data.taxName || data.taxName.trim().length < 1) {
      ctx.addIssue({ code: "custom", path: ["taxName"], message: "Tax name is required" });
    }
    const rate = Number(data.taxRate);
    if (!data.taxRate || Number.isNaN(rate) || rate < 0 || rate > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["taxRate"],
        message: "Enter a rate between 0 and 100",
      });
    }
  });

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "AED", "CAD", "AUD"] as const;

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "India",
  "Germany",
  "Other",
] as const;
