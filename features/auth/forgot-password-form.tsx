"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { getDataSource } from "@/lib/data/provider";
import { toUserMessage } from "@/lib/data/errors";
import { fieldErrors } from "@/lib/forms";
import { AuthCard } from "./auth-card";
import { FormAlert } from "./form-alert";
import { forgotPasswordSchema } from "./schemas";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await getDataSource().auth.requestPasswordReset(parsed.data.email);
      setSent(true);
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description={`If an account exists for ${email}, a reset link is on its way.`}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4">
          <FormAlert variant="success">
            Reset link sent. In this demo, continue to set a new password.
          </FormAlert>
          <Button asChild className="w-full">
            <Link href="/reset-password?token=demo-reset-token">Continue to reset password</Link>
          </Button>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send a reset link."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
