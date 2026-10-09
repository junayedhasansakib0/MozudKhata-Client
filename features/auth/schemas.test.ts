import { describe, it, expect } from "vitest";

import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from "./schemas";
import { fieldErrors } from "@/lib/forms";

describe("auth validation schemas", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).email).toBe("Enter a valid email");
    }
  });

  it("requires an 8+ character password on signup", () => {
    const result = signupSchema.safeParse({
      businessName: "Mozud",
      fullName: "Alex Morgan",
      email: "a@b.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).password).toContain("8");
  });

  it("validates forgot-password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("flags mismatched reset passwords on confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).confirmPassword).toBe("Passwords do not match");
    }
  });
});
