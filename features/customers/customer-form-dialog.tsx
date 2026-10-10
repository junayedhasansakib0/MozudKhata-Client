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
import type { Customer } from "@/lib/data/types";
import { useCustomerMutations } from "./use-customers";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
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

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const { create, update } = useCustomerMutations();
  const [name, setName] = React.useState(customer?.name ?? "");
  const [email, setEmail] = React.useState(customer?.email ?? "");
  const [phone, setPhone] = React.useState(customer?.phone ?? "");
  const [tier, setTier] = React.useState(customer?.loyaltyTier ?? "");
  const [creditLimit, setCreditLimit] = React.useState(
    customer ? (customer.creditLimit.amountMinor / 100).toFixed(2) : "0.00",
  );
  const [status, setStatus] = React.useState<Customer["status"]>(customer?.status ?? "active");

  const pending = create.isPending || update.isPending;

  async function submit() {
    if (!name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    const input = {
      name,
      email,
      phone,
      loyaltyTier: tier || undefined,
      creditLimitMinor: Math.max(0, Math.round(Number(creditLimit) * 100)) || 0,
      status,
    };
    try {
      if (customer) {
        await update.mutateAsync({ id: customer.id, input });
        toast.success("Customer updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Customer added");
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
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>Customers support loyalty tiers and house credit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Loyalty tier">
              <Input
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="e.g. VIP Tier 2"
              />
            </Field>
            <Field label="Credit limit" htmlFor="customer-credit-limit">
              <div className="relative">
                <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="customer-credit-limit"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  inputMode="decimal"
                  className="ps-7 font-mono"
                />
              </div>
            </Field>
          </div>
          <Field label="Status">
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as Customer["status"])}
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
            {pending ? "Saving…" : customer ? "Save changes" : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
