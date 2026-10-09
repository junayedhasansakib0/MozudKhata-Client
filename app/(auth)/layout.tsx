import type { ReactNode } from "react";

import { AuthRedirectGate } from "@/features/auth/auth-redirect-gate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthRedirectGate>
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
        {children}
      </div>
    </AuthRedirectGate>
  );
}
