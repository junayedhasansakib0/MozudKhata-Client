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
import { toUserMessage } from "@/lib/data/errors";
import type { Store } from "@/lib/data/types";
import { useInventoryMutations } from "./use-inventory";

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  defaultFromStoreId: string;
}

interface DraftItem {
  variantId: string;
  label: string;
  quantity: string;
}

export function TransferFormDialog({
  open,
  onOpenChange,
  stores,
  defaultFromStoreId,
}: TransferFormDialogProps) {
  const { createTransfer } = useInventoryMutations();
  const productsQuery = useProducts({ page: 1, pageSize: 1000, status: "all" });

  const variantOptions = React.useMemo(() => {
    const options: { id: string; label: string }[] = [];
    for (const product of productsQuery.data?.data ?? []) {
      for (const variant of product.variants) {
        const suffix = variant.variantName !== "Default" ? ` — ${variant.variantName}` : "";
        options.push({ id: variant.id, label: `${product.name}${suffix} (${variant.sku})` });
      }
    }
    return options;
  }, [productsQuery.data]);

  const [fromStoreId, setFromStoreId] = React.useState(defaultFromStoreId || stores[0]?.id || "");
  const [toStoreId, setToStoreId] = React.useState(
    stores.find((s) => s.id !== (defaultFromStoreId || stores[0]?.id))?.id ?? "",
  );
  const [picked, setPicked] = React.useState("");
  const [pickedQty, setPickedQty] = React.useState("1");
  const [items, setItems] = React.useState<DraftItem[]>([]);

  function addItem() {
    const option = variantOptions.find((o) => o.id === picked);
    if (!option) return;
    const qty = Number(pickedQty);
    if (!Number.isFinite(qty) || qty <= 0) return;
    if (items.some((i) => i.variantId === option.id)) return;
    setItems((prev) => [...prev, { variantId: option.id, label: option.label, quantity: pickedQty }]);
    setPicked("");
    setPickedQty("1");
  }

  async function submit() {
    try {
      await createTransfer.mutateAsync({
        fromStoreId,
        toStoreId,
        items: items.map((i) => ({ variantId: i.variantId, quantity: Number(i.quantity) })),
      });
      toast.success("Transfer draft created");
      setItems([]);
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const canSubmit =
    fromStoreId !== "" && toStoreId !== "" && fromStoreId !== toStoreId && items.length > 0 && !createTransfer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New stock transfer</DialogTitle>
          <DialogDescription>Move stock between two stores. Starts as a draft.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">From</Label>
            <NativeSelect value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)}>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">To</Label>
            <NativeSelect value={toStoreId} onChange={(e) => setToStoreId(e.target.value)}>
              <option value="">Select destination…</option>
              {stores
                .filter((s) => s.id !== fromStoreId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </NativeSelect>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">Items</Label>
          <div className="flex gap-2">
            <NativeSelect value={picked} onChange={(e) => setPicked(e.target.value)} aria-label="Select variant">
              <option value="">Select a product variant…</option>
              {variantOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
            <Input
              value={pickedQty}
              onChange={(e) => setPickedQty(e.target.value)}
              inputMode="numeric"
              className="w-20 font-mono"
              aria-label="Quantity"
            />
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={addItem} aria-label="Add item">
              <Plus className="size-4" />
            </Button>
          </div>
          {items.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{item.label}</span>
                  <span className="font-mono text-code-sku text-muted-foreground">×{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setItems((prev) => prev.filter((i) => i.variantId !== item.variantId))}
                    aria-label="Remove item"
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createTransfer.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {createTransfer.isPending ? "Creating…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
