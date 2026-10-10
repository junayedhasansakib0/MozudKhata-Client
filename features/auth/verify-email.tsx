"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getDataSource } from "@/lib/data/provider";
import { toUserMessage } from "@/lib/data/errors";
import { AuthCard } from "./auth-card";
import { FormAlert } from "./form-alert";
import { useAuth } from "./use-auth";

export function VerifyEmail({ email }: { email: string }) {
  const router = useRouter();
  const { confirmEmail } = useAuth();
  const [pending, setPending] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function onConfirm() {
    setFormError(null);
    setPending(true);
    try {
      await getDataSource().auth.verifyEmail("demo-verification-token");
      confirmEmail();
      router.replace("/onboarding");
    } catch (error) {
      setFormError(toUserMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      description={
        email ? `We sent a verification link to ${email}.` : "We sent you a verification link."
      }
    >
      <div className="space-y-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
        </div>
        <Button className="w-full" onClick={onConfirm} disabled={pending}>
          {pending ? "Verifying…" : "I've verified my email"}
        </Button>
        <button
          type="button"
          onClick={() => toast("Verification email resend is a prototype — no email is sent")}
          className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Resend email
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Wrong address?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
