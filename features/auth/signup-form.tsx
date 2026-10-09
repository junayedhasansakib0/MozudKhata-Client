"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { toUserMessage } from "@/lib/data/errors";
import { fieldErrors } from "@/lib/forms";
import { AuthCard } from "./auth-card";
import { FormAlert } from "./form-alert";
import { signupSchema } from "./schemas";
import { useAuth } from "./use-auth";

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [values, setValues] = React.useState({
    businessName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await signup(parsed.data);
      router.replace(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (error) {
      setFormError(toUserMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start running your business on MozudKhata."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <FormField label="Business name" htmlFor="businessName" error={errors.businessName}>
          <Input
            id="businessName"
            autoComplete="organization"
            placeholder="Mozud Coffee Co."
            value={values.businessName}
            onChange={update("businessName")}
          />
        </FormField>
        <FormField label="Your name" htmlFor="fullName" error={errors.fullName}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={values.fullName}
            onChange={update("fullName")}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={values.email}
            onChange={update("email")}
          />
        </FormField>
        <FormField
          label="Password"
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
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo: use <code className="font-mono">taken@mozud.example</code> to preview the
          duplicate-account error.
        </p>
      </form>
    </AuthCard>
  );
}
