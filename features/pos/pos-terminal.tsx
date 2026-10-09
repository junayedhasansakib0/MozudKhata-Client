"use client";

import * as React from "react";
import { toast } from "sonner";

import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";
import { getDataSource } from "@/lib/data/provider";
import { toUserMessage } from "@/lib/data/errors";
import type { SalePaymentInput, SaleReceipt } from "@/lib/data/types";
import { PageHeader } from "@/components/states/page-header";
import { ErrorState } from "@/components/states/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";

import { CartProvider, useCart } from "./cart-store";
import { computeTotals } from "./cart-math";
import { usePosCategories, usePosProducts, usePosTaxLines } from "./use-pos-data";
import { usePosShortcuts } from "./use-pos-shortcuts";
import { ProductSearch } from "./product-search";
import { CategoryPills } from "./category-pills";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { CustomerDialog } from "./customer-dialog";
import { DiscountDialog } from "./discount-dialog";
import { PaymentDialog } from "./payment-dialog";
import { ReceiptDialog } from "./receipt-dialog";

export function PosTerminal() {
  return (
    <CartProvider>
      <PosTerminalInner />
    </CartProvider>
  );
}

function PosTerminalInner() {
  const cart = useCart();
  const { activeStoreId } = useActiveStore();
  const { data: session } = useSession();
  const storeId = activeStoreId ?? session?.activeStoreId;

  const productsQuery = usePosProducts(storeId);
  const categoriesQuery = usePosCategories(storeId);
  const taxQuery = usePosTaxLines(storeId);
  const products = React.useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const taxLines = taxQuery.data ?? [];

  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [cartSheetOpen, setCartSheetOpen] = React.useState(false);
  const [prefillCash, setPrefillCash] = React.useState<number | undefined>(undefined);
  const [completing, setCompleting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<SaleReceipt | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  const loyaltyPct = cart.customer?.loyaltyDiscountPct ?? 0;
  const totals = computeTotals({
    lines: cart.lines,
    discount: cart.discount,
    loyaltyPct,
    taxLines,
  });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (activeCategory && product.categoryId !== activeCategory) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.barcode ?? "").includes(q)
      );
    });
  }, [products, activeCategory, query]);

  function submitSearch() {
    const q = query.trim();
    if (!q) return;
    const exact = products.find((p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase());
    const match = exact ?? filtered[0];
    if (match && match.stock > 0) {
      cart.add(match);
      setQuery("");
    }
  }

  function checkout(prefill?: number) {
    if (cart.lines.length === 0) return;
    setPrefillCash(prefill);
    setCartSheetOpen(false);
    setPaymentOpen(true);
  }

  async function completeSale(payments: SalePaymentInput[]) {
    if (!storeId) return;
    setCompleting(true);
    try {
      const result = await getDataSource().pos.createSale({
        storeId,
        customerId: cart.customer?.id,
        lines: cart.lines.map((l) => ({
          variantId: l.variantId,
          name: l.name,
          quantity: l.quantity,
          unitPriceMinor: l.unitPriceMinor,
        })),
        discountTotalMinor: totals.discountTotalMinor,
        payments,
        idempotencyKey: crypto.randomUUID(),
        currency: "USD",
      });
      setReceipt(result);
      setPaymentOpen(false);
      setReceiptOpen(true);
    } catch (error) {
      toast(toUserMessage(error));
    } finally {
      setCompleting(false);
    }
  }

  function newSale() {
    cart.clear();
    setReceiptOpen(false);
    setReceipt(null);
  }

  const anyDialogOpen = customerOpen || discountOpen || paymentOpen || receiptOpen || cartSheetOpen;
  usePosShortcuts(
    {
      onFocusSearch: () => searchRef.current?.focus(),
      onHold: () => cart.hold(),
      onDiscount: () => cart.lines.length > 0 && setDiscountOpen(true),
      onFastCash: () => checkout(totals.totalMinor),
      onPay: () => checkout(),
    },
    !anyDialogOpen,
  );

  if (productsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Core Operations" title="POS Terminal" />
        <ErrorState error={productsQuery.error} onRetry={() => productsQuery.refetch()} />
      </div>
    );
  }

  const loading = productsQuery.isLoading || !storeId;

  const cartPanel = (
    <CartPanel
      taxLines={taxLines}
      onOpenCustomer={() => setCustomerOpen(true)}
      onOpenDiscount={() => setDiscountOpen(true)}
      onCheckout={checkout}
    />
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <span className="size-2 rounded-full bg-success" />
            Active terminal · Online
          </span>
          <span className="hidden text-xs text-muted-foreground md:inline">
            F2 search · F3 hold · F4 discount · F9 fast cash
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={cart.held.length === 0}>
              Held orders ({cart.held.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Held orders</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {cart.held.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">No held orders.</p>
            ) : (
              cart.held.map((order) => (
                <DropdownMenuItem key={order.id} onSelect={() => cart.recall(order.id)}>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{order.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {order.lines.length} items
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <ProductSearch
            value={query}
            onChange={setQuery}
            onSubmit={submitSearch}
            inputRef={searchRef}
          />
          {loading ? (
            <>
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-28 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-28" />
                ))}
              </div>
            </>
          ) : (
            <>
              <CategoryPills
                categories={categoriesQuery.data ?? []}
                total={products.length}
                active={activeCategory}
                onChange={setActiveCategory}
              />
              <ProductGrid products={filtered} onAdd={cart.add} />
            </>
          )}
        </div>

        <aside className="hidden rounded-lg border border-border bg-card lg:sticky lg:top-[5.5rem] lg:block lg:h-[calc(100dvh-7.5rem)]">
          {cartPanel}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card p-3 lg:hidden">
        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetTrigger asChild>
            <Button
              className="h-12 w-full justify-between text-base"
              disabled={cart.lines.length === 0}
            >
              <span>View cart ({totals.itemCount})</span>
              <span className="tabular-nums">
                {formatMoney({ amountMinor: totals.totalMinor, currency: "USD" })}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md">
            <SheetTitle className="sr-only">Cart</SheetTitle>
            {cartPanel}
          </SheetContent>
        </Sheet>
      </div>

      {customerOpen ? (
        <CustomerDialog
          open={customerOpen}
          onOpenChange={setCustomerOpen}
          hasCustomer={Boolean(cart.customer)}
          onSelect={cart.setCustomer}
        />
      ) : null}
      {discountOpen ? (
        <DiscountDialog
          open={discountOpen}
          onOpenChange={setDiscountOpen}
          subtotalMinor={totals.subtotalMinor}
          current={cart.discount}
          onApply={cart.setDiscount}
        />
      ) : null}
      {paymentOpen ? (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          totalMinor={totals.totalMinor}
          hasCustomer={Boolean(cart.customer)}
          initialCashMinor={prefillCash}
          pending={completing}
          onComplete={completeSale}
        />
      ) : null}
      {receiptOpen ? (
        <ReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          receipt={receipt}
          onNewSale={newSale}
        />
      ) : null}
    </div>
  );
}
