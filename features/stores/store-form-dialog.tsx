"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toUserMessage } from "@/lib/data/errors";
import type { Store } from "@/lib/data/types";
import { useStoreMutations } from "./use-stores-admin";

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store | null;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const generatedId = React.useId();
  const id = htmlFor ?? generatedId;
  const control =
    !htmlFor && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: (children.props as { id?: string }).id ?? id,
        })
      : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-label-sm uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {control}
    </div>
  );
}

export function StoreFormDialog({ open, onOpenChange, store }: StoreFormDialogProps) {
  const { create, update } = useStoreMutations();
  const [name, setName] = React.useState(store?.name ?? "");
  const [code, setCode] = React.useState(store?.code ?? "");
  const [city, setCity] = React.useState(store?.city ?? "");
  const [currency, setCurrency] = React.useState(store?.currency ?? "USD");
  const [status, setStatus] = React.useState<Store["status"]>(store?.status ?? "active");
  const [error, setError] = React.useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  async function submit() {
    if (!name.trim()) return setError("Store name is required.");
    if (!code.trim()) return setError("Store code is required.");
    setError(null);
    const input = { name, code, city, currency, status };
    try {
      if (store) {
        await update.mutateAsync({ id: store.id, input });
        toast.success("Store updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Store added");
      }
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{store ? "Edit store" : "Add store"}</DialogTitle>
          <DialogDescription>Store locations within this tenant.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Store name"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. AUS-04"
                className="font-mono uppercase"
              />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </Field>
            <Field label="Status">
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as Store["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </NativeSelect>
            </Field>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : store ? "Save changes" : "Add store"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
