import { describe, it, expect } from "vitest";

import { createMockDataSource } from "./mock-adapter";

describe("mock data source (contract)", () => {
  const ds = createMockDataSource();

  it("returns a session whose active store is among its stores", async () => {
    const session = await ds.session.getCurrentSession();
    expect(session.user.fullName).toBeTruthy();
    expect(session.tenant.baseCurrency).toBe("USD");
    expect(session.stores.some((store) => store.id === session.activeStoreId)).toBe(true);
  });

  it("lists stores and resolves one by id", async () => {
    const stores = await ds.stores.list();
    expect(stores.length).toBeGreaterThan(0);

    const first = await ds.stores.getById(stores[0]!.id);
    expect(first?.id).toBe(stores[0]!.id);
    expect(await ds.stores.getById("does-not-exist")).toBeNull();
  });

  it("unread count matches unread notifications", async () => {
    const [count, list] = await Promise.all([
      ds.notifications.unreadCount(),
      ds.notifications.list(),
    ]);
    expect(count).toBe(list.filter((n) => !n.read).length);
  });

  it("does not leak mutations back into the seed", async () => {
    const a = await ds.stores.list();
    a[0]!.name = "MUTATED";
    const b = await ds.stores.list();
    expect(b[0]!.name).not.toBe("MUTATED");
  });

  it("returns a complete dashboard overview", async () => {
    const data = await ds.dashboard.getOverview({ storeId: "store_downtown", range: "today" });
    expect(data.kpis.netProfit.value.currency).toBe("USD");
    expect(data.hourly.length).toBeGreaterThan(0);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.topProducts.length).toBeGreaterThan(0);
    expect(data.recentTransactions.length).toBeGreaterThan(0);
  });

  it("scales overview totals with the date range", async () => {
    const today = await ds.dashboard.getOverview({ storeId: "store_downtown", range: "today" });
    const month = await ds.dashboard.getOverview({ storeId: "store_downtown", range: "30d" });
    expect(month.kpis.grossSales.value.amountMinor).toBeGreaterThan(
      today.kpis.grossSales.value.amountMinor,
    );
  });

  it("lists POS products, categories, and tax lines", async () => {
    const products = await ds.pos.listProducts({ storeId: "store_downtown" });
    const categories = await ds.pos.listCategories({ storeId: "store_downtown" });
    const tax = await ds.pos.getTaxLines({ storeId: "store_downtown" });
    expect(products.length).toBeGreaterThan(0);
    expect(categories.reduce((sum, c) => sum + c.count, 0)).toBe(products.length);
    expect(tax[0]!.rate).toBeGreaterThan(0);
  });

  it("creates a sale and dedupes by idempotency key", async () => {
    const input = {
      storeId: "store_downtown",
      lines: [
        {
          variantId: "p_flatwhite",
          name: "Signature Flat White",
          quantity: 2,
          unitPriceMinor: 475,
        },
      ],
      discountTotalMinor: 0,
      payments: [{ method: "cash" as const, amountMinor: 2000 }],
      idempotencyKey: "test-key-1",
      currency: "USD",
    };
    const first = await ds.pos.createSale(input);
    const second = await ds.pos.createSale(input);
    expect(first.orderNumber).toBe(second.orderNumber); // idempotent replay
    expect(first.subtotalMinor).toBe(950);
    expect(first.taxTotalMinor).toBe(Math.round(950 * 0.0825));
    expect(first.totalMinor).toBe(950 + first.taxTotalMinor);
    expect(first.changeMinor).toBe(2000 - first.totalMinor);
  });
});
