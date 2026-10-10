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
import { Textarea } from "@/components/ui/textarea";
import { toUserMessage } from "@/lib/data/errors";
import type { Expense, ExpenseCategory, Store } from "@/lib/data/types";
import { EXPENSE_CATEGORY_OPTIONS } from "./categories";
import { useExpenseMutations } from "./use-expenses";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  stores: Store[];
  defaultStoreId: string;
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

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  stores,
  defaultStoreId,
}: ExpenseFormDialogProps) {
  const { create, update } = useExpenseMutations();
  const [storeId, setStoreId] = React.useState(
    expense?.storeId ?? defaultStoreId ?? stores[0]?.id ?? "",
  );
  const [category, setCategory] = React.useState<ExpenseCategory>(expense?.category ?? "supplies");
  const [amount, setAmount] = React.useState(
    expense ? (expense.amount.amountMinor / 100).toFixed(2) : "",
  );
  const [description, setDescription] = React.useState(expense?.description ?? "");
  const [spentAt, setSpentAt] = React.useState(
    (expense?.spentAt ?? new Date().toISOString()).slice(0, 10),
  );
  const [error, setError] = React.useState<string | null>(null);

  const pending = create.isPending || update.isPending;
  const effectiveStoreId = storeId || defaultStoreId || stores[0]?.id || "";

  async function submit() {
    const amountMinor = Math.round(Number(amount) * 100);
    if (!amount || Number.isNaN(amountMinor) || amountMinor <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!spentAt) {
      setError("Pick a date.");
      return;
    }
    setError(null);
    const input = {
      storeId: effectiveStoreId,
      category,
      amountMinor,
      description,
      spentAt: new Date(spentAt).toISOString(),
    };
    try {
      if (expense) {
        await update.mutateAsync({ id: expense.id, input });
        toast.success("Expense updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Expense recorded");
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
          <DialogTitle>{expense ? "Edit expense" : "Record expense"}</DialogTitle>
          <DialogDescription>Store-scoped, categorized operating expense.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Store">
              <NativeSelect
                value={effectiveStoreId}
                onChange={(e) => setStoreId(e.target.value)}
                aria-label="Store"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Category">
              <NativeSelect
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                aria-label="Category"
              >
                {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <div className="relative">
                <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-7 font-mono"
                  aria-label="Amount"
                />
              </div>
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                aria-label="Date"
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              className="min-h-[64px]"
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : expense ? "Save changes" : "Record expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
