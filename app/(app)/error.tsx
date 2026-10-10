"use client";

import { ErrorState } from "@/components/states/error-state";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="p-6">
      <ErrorState error={error} onRetry={retry} />
    </div>
  );
}
