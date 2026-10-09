"use client";

import * as React from "react";
import { Banknote, CreditCard, QrCode, Trash2, Wallet } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SalePaymentInput, TenderMethod } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHODS: { key: TenderMethod; label: string; icon: typeof Banknote }[] = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "qr_wallet", label: "QR Wallet", icon: QrCode },
  { key: "house_credit", label: "House Credit", icon: Wallet },
];

const QUICK_CASH = [2000, 4000, 5000, 10000];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalMinor: number;
  hasCustomer: boolean;
  initialCashMinor?: number;
  pending: boolean;
  onComplete: (payments: SalePaymentInput[]) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  totalMinor,
  hasCustomer,
  initialCashMinor,
  pending,
  onComplete,
}: PaymentDialogProps) {
  const money = (amountMinor: number) => formatMoney({ amountMinor, currency: "USD" });
  const seed = initialCashMinor
    ? [{ method: "cash" as TenderMethod, amountMinor: initialCashMinor }]
    : [];
  const [payments, setPayments] = React.useState<SalePaymentInput[]>(seed);
  const [method, setMethod] = React.useState<TenderMethod>("cash");

  const paid = payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remaining = Math.max(0, totalMinor - paid);
  const change = Math.max(0, paid - totalMinor);
  const settled = paid >= totalMinor;

  const [amount, setAmount] = React.useState(
    ((initialCashMinor ? remaining : totalMinor) / 100).toFixed(2),
  );

  function addPayment(method_: TenderMethod, amountMinor: number) {
    if (amountMinor <= 0) return;
    const next = [...payments, { method: method_, amountMinor }];
    setPayments(next);
    const nextRemaining = Math.max(0, totalMinor - next.reduce((s, p) => s + p.amountMinor, 0));
    setAmount((nextRemaining / 100).toFixed(2));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {settled ? "Change due" : "Amount due"}
          </p>
          <p className="font-display text-kpi tabular-nums text-foreground">
            {money(settled ? change : remaining)}
          </p>
        </div>

        {payments.length > 0 ? (
          <ul className="space-y-1">
            {payments.map((payment, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {METHODS.find((m) => m.key === payment.method)?.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-foreground">
                    {money(payment.amountMinor)}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove payment"
                    onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {!settled ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map((option) => {
                const disabled = option.key === "house_credit" && !hasCustomer;
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(option.key)}
                    title={disabled ? "Assign a customer to use house credit" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors",
                      method === option.key
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {method === "cash" ? (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CASH.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount((amt / 100).toFixed(2))}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                  >
                    {money(amt)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount((remaining / 100).toFixed(2))}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                >
                  Exact
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="ps-7"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => addPayment(method, Math.round(Number(amount) * 100) || 0)}
              >
                Add tender
              </Button>
            </div>
          </div>
        ) : null}

        <Button
          className="h-12 w-full text-base"
          disabled={!settled || pending}
          onClick={() => onComplete(payments)}
        >
          {pending ? "Completing…" : `Complete sale · ${money(totalMinor)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
