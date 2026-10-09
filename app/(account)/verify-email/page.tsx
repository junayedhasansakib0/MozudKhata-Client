import type { Metadata } from "next";

import { VerifyEmail } from "@/features/auth/verify-email";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmail email={email ?? ""} />;
}
