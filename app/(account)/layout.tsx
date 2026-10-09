import type { ReactNode } from "react";

import { AuthGuard } from "@/features/auth/auth-guard";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
        {children}
      </div>
    </AuthGuard>
  );
}
