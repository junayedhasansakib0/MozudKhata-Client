"use client";

import * as React from "react";
import { ScanBarcode } from "lucide-react";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ProductSearch({ value, onChange, onSubmit, inputRef }: ProductSearchProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <ScanBarcode className="size-5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Scan barcode or search name, SKU… (press / or F2)"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Search or scan products"
        autoComplete="off"
      />
    </div>
  );
}
