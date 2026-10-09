"use client";

import { Pause, Percent, Trash2, UserPlus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TaxLine } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { computeTotals } from "./cart-math";
import { useCart } from "./cart-store";
import { CartLineRow } from "./cart-line-row";

interface CartPanelProps {
  taxLines: TaxLine[];
  onOpenCustomer: () => void;
  onOpenDiscount: () => void;
  onCheckout: (prefillCashMinor?: number) => void;
}

export function CartPanel({
  taxLines,
  onOpenCustomer,
  onOpenDiscount,
  onCheckout,
}: CartPanelProps) {
  const cart = useCart();
  const money = (amountMinor: number) => formatMoney({ amountMinor, currency: "USD" });
  const loyaltyPct = cart.customer?.loyaltyDiscountPct ?? 0;
  const totals = computeTotals({
    lines: cart.lines,
    discount: cart.discount,
    loyaltyPct,
    taxLines,
  });
  const empty = cart.lines.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-headline-sm font-display font-semibold text-foreground">New order</p>
          <p className="text-xs text-muted-foreground">
            {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <Badge variant="secondary">Retail</Badge>
      </div>

      <button
        type="button"
        onClick={onOpenCustomer}
        className="flex items-center gap-3 border-b border-border px-4 py-3 text-start transition-colors hover:bg-muted"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {cart.customer ? <UserRound className="size-4" /> : <UserPlus className="size-4" />}
        </span>
        {cart.customer ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {cart.customer.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {cart.customer.loyaltyTier ?? "Guest"}
              {loyaltyPct ? ` · ${loyaltyPct}% loyalty` : ""}
            </span>
          </span>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">Add customer (optional)</span>
        )}
        <span className="text-xs font-medium text-primary">{cart.customer ? "Change" : "Add"}</span>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Cart is empty</p>
            <p className="text-xs text-muted-foreground">Scan or tap a product to start a sale.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cart.lines.map((line) => (
              <CartLineRow
                key={line.variantId}
                line={line}
                onQty={(quantity) => cart.setQty(line.variantId, quantity)}
                onRemove={() => cart.remove(line.variantId)}
              />
            ))}
          </div>
        )}
      </div>
      {/* __CART_FOOTER__ */}
      <div className="border-t border-border px-4 py-3">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums text-foreground">{money(totals.subtotalMinor)}</dd>
          </div>
          {totals.manualDiscountMinor > 0 ? (
            <div className="flex justify-between text-success">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{money(totals.manualDiscountMinor)}</dd>
            </div>
          ) : null}
          {totals.loyaltyDiscountMinor > 0 ? (
            <div className="flex justify-between text-success">
              <dt>Loyalty ({loyaltyPct}%)</dt>
              <dd className="tabular-nums">−{money(totals.loyaltyDiscountMinor)}</dd>
            </div>
          ) : null}
          {taxLines.map((tax) => (
            <div key={tax.id} className="flex justify-between">
              <dt className="text-muted-foreground">{tax.name}</dt>
              <dd className="tabular-nums text-foreground">
                {money(Math.round((totals.subtotalMinor - totals.discountTotalMinor) * tax.rate))}
              </dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(totals.totalMinor)}</dd>
          </div>
        </dl>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Button variant="outline" size="sm" disabled={empty} onClick={cart.hold}>
            <Pause className="size-4" />
            Hold
          </Button>
          <Button variant="outline" size="sm" disabled={empty} onClick={onOpenDiscount}>
            <Percent className="size-4" />
            Discount
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={empty}
            onClick={cart.clear}
            className="text-destructive"
          >
            <Trash2 className="size-4" />
            Clear
          </Button>
        </div>

        {!empty ? (
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onCheckout(totals.totalMinor)}
              className="rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Exact
            </button>
            <button
              type="button"
              onClick={() => onCheckout(4000)}
              className="rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {money(4000)}
            </button>
            <button
              type="button"
              onClick={() => onCheckout(5000)}
              className="rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {money(5000)}
            </button>
          </div>
        ) : null}

        <Button
          className="mt-3 h-12 w-full text-base"
          disabled={empty}
          onClick={() => onCheckout()}
        >
          Proceed to payment
          <span className="ms-auto rounded-sm bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[10px]">
            Space
          </span>
        </Button>
      </div>
    </div>
  );
}
