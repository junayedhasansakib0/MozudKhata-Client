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
import { resetPasswordSchema } from "./schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const [values, setValues] = React.useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await getDataSource().auth.resetPassword(token, parsed.data.password);
      setDone(true);
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="Password updated" description="You can now sign in with your new password.">
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a strong password for your account.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password}
          hint="At least 8 characters."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
          />
        </FormField>
        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
