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
import type { Supplier } from "@/lib/data/types";
import { useSupplierMutations } from "./use-suppliers";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const { create, update } = useSupplierMutations();
  const [name, setName] = React.useState(supplier?.name ?? "");
  const [contactName, setContactName] = React.useState(supplier?.contactName ?? "");
  const [email, setEmail] = React.useState(supplier?.email ?? "");
  const [phone, setPhone] = React.useState(supplier?.phone ?? "");
  const [address, setAddress] = React.useState(supplier?.address ?? "");
  const [status, setStatus] = React.useState<Supplier["status"]>(supplier?.status ?? "active");

  const pending = create.isPending || update.isPending;

  async function submit() {
    if (!name.trim()) {
      toast.error("Supplier name is required.");
      return;
    }
    const input = { name, contactName, email, phone, address, status };
    try {
      if (supplier) {
        await update.mutateAsync({ id: supplier.id, input });
        toast.success("Supplier updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Supplier added");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>Suppliers are referenced by purchase orders.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Status">
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as Supplier["status"])}
              className="sm:w-48"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </NativeSelect>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : supplier ? "Save changes" : "Add supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
