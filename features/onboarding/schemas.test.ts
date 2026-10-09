import { describe, it, expect } from "vitest";

import { businessStepSchema, taxStepSchema } from "./schemas";
import { fieldErrors } from "@/lib/forms";

describe("onboarding step schemas", () => {
  it("requires a business name", () => {
    const result = businessStepSchema.safeParse({ businessName: "", country: "United States" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).businessName).toBeTruthy();
  });

  it("accepts a valid business step", () => {
    expect(
      businessStepSchema.safeParse({ businessName: "Mozud", country: "United States" }).success,
    ).toBe(true);
  });

  it("skips tax detail validation when tax is disabled", () => {
    expect(taxStepSchema.safeParse({ taxEnabled: false }).success).toBe(true);
  });

  it("rejects an out-of-range tax rate when enabled", () => {
    const result = taxStepSchema.safeParse({ taxEnabled: true, taxName: "VAT", taxRate: "200" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).taxRate).toBeTruthy();
  });
});
