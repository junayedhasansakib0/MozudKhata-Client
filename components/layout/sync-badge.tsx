import { cn } from "@/lib/utils";

interface SyncBadgeProps {
  className?: string;
}

/**
 * Cloud-sync telemetry badge (UI-UX). Static during Stage 1; wired to real offline /
 * latency state when the POS offline buffer lands (Phase 4 / Stage 3).
 */
export function SyncBadge({ className }: SyncBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success",
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Synced · 12ms
    </span>
  );
}
