"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { toUserMessage } from "@/lib/data/errors";
import { fieldErrors } from "@/lib/forms";
import type { RoleKey } from "@/lib/data/types";
import { AuthCard } from "./auth-card";
import { FormAlert } from "./form-alert";
import { loginSchema } from "./schemas";
import { useAuth } from "./use-auth";

const ROLES: { value: RoleKey; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "store_manager", label: "Store Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory_supervisor", label: "Inventory Supervisor" },
];

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<RoleKey>("store_manager");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await login(parsed.data.email, parsed.data.password, role);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(toUserMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to MozudKhata."
      footer={
        <>
          New to MozudKhata?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
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
        <FormField label="Password" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <div className="-mt-1 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <FormField
          label="Continue as (demo role)"
          htmlFor="role"
          hint="Sets the mock role used for RBAC previews."
        >
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleKey)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo: any email + password signs in. Try password <code className="font-mono">wrong</code>{" "}
          or an email starting with <code className="font-mono">locked</code> for error states.
        </p>
      </form>
    </AuthCard>
  );
}
