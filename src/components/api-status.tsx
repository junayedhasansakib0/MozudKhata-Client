import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

/**
 * Small badge that reflects live backend connectivity via the health endpoint.
 * Doubles as the Phase 01 proof that the SPA can reach the API.
 */
export function ApiStatus() {
  const { data, isPending, isError } = useHealth();

  const state = isPending
    ? { label: "Connecting…", tone: "bg-muted text-muted-foreground" }
    : isError
      ? { label: "API offline", tone: "bg-destructive/10 text-destructive" }
      : { label: `API ${data?.status ?? "ok"}`, tone: "bg-primary/10 text-primary" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        state.tone,
      )}
      title={
        data ? `version ${data.version} · uptime ${Math.round(data.uptime)}s` : undefined
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {state.label}
    </span>
  );
}
