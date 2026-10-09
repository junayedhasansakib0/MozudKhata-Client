import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  showWordmark?: boolean;
}

/** MozudKhata brand mark — matches docs/UI-UX/mozudkhata_brand_logo. */
export function Brand({ className, showWordmark = true }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="44" height="44" rx="10" fill="#4F46E5" />
        <path
          d="M12 32V16L22 27L32 16V32"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="14" r="3" fill="#10B981" />
      </svg>
      {showWordmark ? (
        <div className="leading-tight">
          <div className="font-display text-base font-extrabold tracking-tight text-foreground">
            Mozud<span className="text-brand">Khata</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Enterprise Cloud POS
          </div>
        </div>
      ) : (
        <span className="sr-only">MozudKhata</span>
      )}
    </div>
  );
}
