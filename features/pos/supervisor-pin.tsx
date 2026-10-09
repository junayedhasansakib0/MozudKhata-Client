"use client";

import { ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SupervisorPinProps {
  value: string;
  onChange: (value: string) => void;
  /** What is being authorized, e.g. "a discount over 20%". */
  reason: string;
}

/** Reusable supervisor-override challenge (mock). Reused for voids/adjustments later. */
export function SupervisorPin({ value, onChange, reason }: SupervisorPinProps) {
  return (
    <div className="space-y-1.5 rounded-md border border-warning/40 bg-warning/10 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ShieldCheck className="size-4 text-warning" />
        Supervisor override required
      </div>
      <p className="text-xs text-muted-foreground">
        {reason} needs manager authorization. Enter a supervisor PIN to continue.
      </p>
      <Label htmlFor="supervisor-pin" className="sr-only">
        Supervisor PIN
      </Label>
      <Input
        id="supervisor-pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Supervisor PIN"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
