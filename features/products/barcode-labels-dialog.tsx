"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Money, Product } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";

interface BarcodeLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

function FauxBarcode({ seed }: { seed: string }) {
  // Deterministic bar widths from the SKU — a visual stand-in, not a real symbology.
  const bars = Array.from(seed).map((ch) => (ch.charCodeAt(0) % 3) + 1);
  return (
    <div className="flex h-10 items-end gap-[1px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="bg-foreground" style={{ width: `${w}px`, height: "100%" }} />
      ))}
    </div>
  );
}

export function BarcodeLabelsDialog({ open, onOpenChange, products }: BarcodeLabelsDialogProps) {
  const labels = products.flatMap((p) =>
    p.variants.map((v) => ({
      key: v.id,
      name: p.variants.length > 1 ? `${p.name} — ${v.variantName}` : p.name,
      sku: v.sku,
      barcode: v.barcode ?? v.sku,
      price: formatMoney({ amountMinor: v.sellPrice.amountMinor, currency: v.sellPrice.currency } satisfies Money),
    })),
  );

  function print() {
    toast.success(`${labels.length} barcode ${labels.length === 1 ? "label" : "labels"} queued to the label printer`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print barcode labels</DialogTitle>
          <DialogDescription>
            Preview of {labels.length} {labels.length === 1 ? "label" : "labels"} across{" "}
            {products.length} {products.length === 1 ? "product" : "products"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {labels.map((label) => (
            <div key={label.key} className="rounded-md border border-border bg-card p-2 text-center">
              <p className="truncate text-xs font-medium text-foreground" title={label.name}>
                {label.name}
              </p>
              <p className="font-display text-sm font-bold tabular-nums text-foreground">{label.price}</p>
              <div className="mt-1 flex justify-center">
                <FauxBarcode seed={label.barcode} />
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{label.barcode}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={print} disabled={labels.length === 0}>
            Print {labels.length} {labels.length === 1 ? "label" : "labels"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
