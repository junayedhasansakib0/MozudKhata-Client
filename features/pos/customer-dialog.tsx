"use client";

import * as React from "react";
import { Search, UserRound } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PosCustomer } from "@/lib/data/types";
import { usePosCustomers } from "./use-pos-data";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: PosCustomer | null) => void;
  hasCustomer: boolean;
}

export function CustomerDialog({ open, onOpenChange, onSelect, hasCustomer }: CustomerDialogProps) {
  const [query, setQuery] = React.useState("");
  const { data = [] } = usePosCustomers(query);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or phone"
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {data.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(customer);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-start hover:bg-muted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {customer.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {customer.loyaltyTier ?? "Guest"}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                      {customer.loyaltyDiscountPct
                        ? ` · ${customer.loyaltyDiscountPct}% loyalty`
                        : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {data.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No customers found.
              </li>
            ) : null}
          </ul>
          {hasCustomer ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                onSelect(null);
                onOpenChange(false);
              }}
            >
              Remove customer (walk-in)
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
