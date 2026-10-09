import { describe, it, expect } from "vitest";

import { cartReducer, type CartLine } from "./cart-store";
import type { PosProduct } from "@/lib/data/types";

const product: PosProduct = {
  id: "p1",
  name: "Flat White",
  sku: "CF-001",
  categoryId: "c",
  categoryName: "Coffee",
  price: { amountMinor: 475, currency: "USD" },
  stock: 3,
  unit: "each",
};

const empty = {
  lines: [] as CartLine[],
  customer: null,
  discount: { kind: "none" } as const,
  held: [],
};

describe("cartReducer", () => {
  it("adds a product and increments quantity on re-add", () => {
    let state = cartReducer(empty, { type: "ADD", product });
    expect(state.lines).toHaveLength(1);
    state = cartReducer(state, { type: "ADD", product });
    expect(state.lines[0]!.quantity).toBe(2);
  });

  it("caps quantity at available stock", () => {
    let state = cartReducer(empty, { type: "ADD", product });
    state = cartReducer(state, { type: "SET_QTY", variantId: "p1", quantity: 99 });
    expect(state.lines[0]!.quantity).toBe(3);
  });

  it("removes a line when quantity drops to zero", () => {
    let state = cartReducer(empty, { type: "ADD", product });
    state = cartReducer(state, { type: "SET_QTY", variantId: "p1", quantity: 0 });
    expect(state.lines).toHaveLength(0);
  });

  it("holds then recalls an order", () => {
    let state = cartReducer(empty, { type: "ADD", product });
    state = cartReducer(state, { type: "HOLD" });
    expect(state.lines).toHaveLength(0);
    expect(state.held).toHaveLength(1);

    const heldId = state.held[0]!.id;
    state = cartReducer(state, { type: "RECALL", id: heldId });
    expect(state.lines).toHaveLength(1);
    expect(state.held).toHaveLength(0);
  });

  it("clears the current cart but keeps held orders", () => {
    let state = cartReducer(empty, { type: "ADD", product });
    state = cartReducer(state, { type: "HOLD" });
    state = cartReducer(state, { type: "ADD", product });
    state = cartReducer(state, { type: "CLEAR" });
    expect(state.lines).toHaveLength(0);
    expect(state.held).toHaveLength(1);
  });
});
