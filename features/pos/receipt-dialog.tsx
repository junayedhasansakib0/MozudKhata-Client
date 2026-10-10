"use client";

import { CircleCheck, Printer } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SaleReceipt, TenderMethod } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";

const METHOD_LABELS: Record<TenderMethod, string> = {
  cash: "Cash",
  card: "Card",
  qr_wallet: "QR Wallet",
  house_credit: "House Credit",
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-foreground" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: SaleReceipt | null;
  onNewSale: () => void;
}

export function ReceiptDialog({ open, onOpenChange, receipt, onNewSale }: ReceiptDialogProps) {
  if (!receipt) return null;
  const money = (amountMinor: number) => formatMoney({ amountMinor, currency: receipt.currency });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="sr-only">Receipt {receipt.orderNumber}</DialogTitle>
        <DialogDescription className="sr-only">
          Sale completed. Print the receipt or start a new sale.
        </DialogDescription>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck className="size-6" />
          </span>
          <p className="text-headline-sm font-display font-semibold text-foreground">
            Payment complete
          </p>
          {receipt.changeMinor > 0 ? (
            <p className="text-sm text-muted-foreground">
              Change due{" "}
              <span className="font-semibold text-foreground">{money(receipt.changeMinor)}</span>
            </p>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-[20rem] rounded-md border border-dashed border-border bg-card p-4 font-mono text-xs text-muted-foreground">
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">MozudKhata</p>
            <p>{receipt.storeName}</p>
            <p>
              {receipt.orderNumber} · {new Date(receipt.completedAt).toLocaleString()}
            </p>
            <p>Cashier: {receipt.cashierName}</p>
            {receipt.customerName ? <p>Customer: {receipt.customerName}</p> : null}
          </div>
          <div className="my-2 border-t border-dashed border-border" />
          <div className="space-y-1">
            {receipt.lines.map((line, index) => (
              <div key={index} className="flex justify-between gap-2">
                <span className="truncate text-foreground">
                  {line.quantity}× {line.name}
                </span>
                <span className="tabular-nums">{money(line.lineTotalMinor)}</span>
              </div>
            ))}
          </div>
          <div className="my-2 border-t border-dashed border-border" />
          <div className="space-y-1">
            <Row label="Subtotal" value={money(receipt.subtotalMinor)} />
            {receipt.discountTotalMinor > 0 ? (
              <Row label="Discount" value={`−${money(receipt.discountTotalMinor)}`} />
            ) : null}
            <Row label="Tax" value={money(receipt.taxTotalMinor)} />
            <Row label="Total" value={money(receipt.totalMinor)} strong />
          </div>
          <div className="my-2 border-t border-dashed border-border" />
          <div className="space-y-1">
            {receipt.payments.map((payment, index) => (
              <Row
                key={index}
                label={METHOD_LABELS[payment.method]}
                value={money(payment.amountMinor)}
              />
            ))}
            {receipt.changeMinor > 0 ? (
              <Row label="Change" value={money(receipt.changeMinor)} />
            ) : null}
          </div>
          <p className="mt-3 text-center">Thank you!</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button className="flex-1" onClick={onNewSale}>
            New sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
