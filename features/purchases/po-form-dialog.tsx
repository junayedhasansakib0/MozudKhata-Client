"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useProducts } from "@/features/products/use-products";
import { useSuppliers } from "@/features/suppliers/use-suppliers";
import { toUserMessage } from "@/lib/data/errors";
import type { Store } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { usePurchaseMutations } from "./use-purchases";

interface PoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  defaultStoreId: string;
}

interface DraftLine {
  variantId: string;
  label: string;
  defaultCostMinor: number;
  quantity: string;
  unitCost: string;
}

export function PoFormDialog({ open, onOpenChange, stores, defaultStoreId }: PoFormDialogProps) {
  const { create } = usePurchaseMutations();
  const suppliersQuery = useSuppliers();
  const productsQuery = useProducts({ page: 1, pageSize: 1000, status: "all" });

  const variantOptions = React.useMemo(() => {
    const options: { id: string; label: string; costMinor: number }[] = [];
    for (const product of productsQuery.data?.data ?? []) {
      for (const variant of product.variants) {
        const suffix = variant.variantName !== "Default" ? ` — ${variant.variantName}` : "";
        options.push({
          id: variant.id,
          label: `${product.name}${suffix} (${variant.sku})`,
          costMinor: variant.costPrice.amountMinor,
        });
      }
    }
    return options;
  }, [productsQuery.data]);

  const activeSuppliers = (suppliersQuery.data ?? []).filter((s) => s.status === "active");

  const [supplierId, setSupplierId] = React.useState("");
  const [storeId, setStoreId] = React.useState(defaultStoreId || stores[0]?.id || "");
  const [expectedAt, setExpectedAt] = React.useState("");
  const [picked, setPicked] = React.useState("");
  const [lines, setLines] = React.useState<DraftLine[]>([]);

  // Stores may still be loading when the dialog mounts; fall back to the first store
  // so the field is never silently empty.
  const effectiveStoreId = storeId || defaultStoreId || stores[0]?.id || "";

  function addLine() {
    const option = variantOptions.find((o) => o.id === picked);
    if (!option || lines.some((l) => l.variantId === option.id)) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: option.id,
        label: option.label,
        defaultCostMinor: option.costMinor,
        quantity: "1",
        unitCost: (option.costMinor / 100).toFixed(2),
      },
    ]);
    setPicked("");
  }

  function patchLine(variantId: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, ...patch } : l)));
  }

  const subtotalMinor = lines.reduce(
    (sum, l) => sum + Math.round(Number(l.unitCost || 0) * 100) * Math.max(0, Number(l.quantity || 0)),
    0,
  );

  async function submit() {
    try {
      await create.mutateAsync({
        supplierId,
        storeId: effectiveStoreId,
        expectedAt: expectedAt ? new Date(expectedAt).toISOString() : undefined,
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantityOrdered: Number(l.quantity),
          unitCostMinor: Math.round(Number(l.unitCost) * 100),
        })),
      });
      toast.success("Purchase order draft created");
      setLines([]);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const canSubmit = supplierId !== "" && effectiveStoreId !== "" && lines.length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>Raise a draft PO against a supplier for a store.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Supplier</Label>
            <NativeSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)} aria-label="Supplier">
              <option value="">Select supplier…</option>
              {activeSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Store</Label>
            <NativeSelect value={effectiveStoreId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store">
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po-expected" className="text-label-sm uppercase tracking-wide text-muted-foreground">
              Expected
            </Label>
            <Input id="po-expected" type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Items</Label>
          <div className="flex gap-2">
            <NativeSelect value={picked} onChange={(e) => setPicked(e.target.value)} aria-label="Select variant">
              <option value="">Add a product variant…</option>
              {variantOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={addLine} aria-label="Add line">
              <Plus className="size-4" />
            </Button>
          </div>
          {lines.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {lines.map((line) => (
                <li key={line.variantId} className="flex items-center gap-2 p-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{line.label}</span>
                  <Input
                    value={line.quantity}
                    onChange={(e) => patchLine(line.variantId, { quantity: e.target.value })}
                    inputMode="numeric"
                    className="w-16 font-mono"
                    aria-label={`Quantity for ${line.label}`}
                  />
                  <div className="relative w-24">
                    <span className="pointer-events-none absolute start-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                    <Input
                      value={line.unitCost}
                      onChange={(e) => patchLine(line.variantId, { unitCost: e.target.value })}
                      inputMode="decimal"
                      className="pl-5 font-mono"
                      aria-label={`Unit cost for ${line.label}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setLines((prev) => prev.filter((l) => l.variantId !== line.variantId))}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No items added yet.</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-display text-headline-sm font-bold tabular-nums text-foreground">
            {formatMoney({ amountMinor: subtotalMinor, currency: "USD" })}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Creating…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
