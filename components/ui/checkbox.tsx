"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  checked?: boolean;
  /** Tri-state: renders a dash and reports as not-checked when toggled. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Accessible checkbox built on a native button with role="checkbox" — no extra Radix
 * dependency. Styled to the UI-UX palette (accent primary, hairline border).
 */
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, indeterminate = false, onCheckedChange, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border border-border ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked || indeterminate ? "border-primary bg-primary text-primary-foreground" : "bg-card",
        className,
      )}
      {...props}
    >
      {indeterminate ? (
        <Minus className="size-3.5" />
      ) : checked ? (
        <Check className="size-3.5" />
      ) : null}
    </button>
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
