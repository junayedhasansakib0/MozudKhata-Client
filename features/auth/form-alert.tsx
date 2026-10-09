import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormAlertProps {
  children: ReactNode;
  variant?: "error" | "success";
}

export function FormAlert({ children, variant = "error" }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-success/30 bg-success/10 text-success",
      )}
    >
      {children}
    </div>
  );
}
