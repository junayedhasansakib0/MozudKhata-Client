"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./use-auth";

/** Keeps authenticated users out of the auth pages (sends them to the dashboard). */
export function AuthRedirectGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "authenticated") return null;
  return <>{children}</>;
}
