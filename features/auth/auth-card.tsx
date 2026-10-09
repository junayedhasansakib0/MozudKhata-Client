import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="font-display text-headline-md font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
      {footer ? <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p> : null}
    </div>
  );
}
