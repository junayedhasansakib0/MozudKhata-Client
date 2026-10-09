"use client";

import * as React from "react";

import type { PosCustomer, PosProduct } from "@/lib/data/types";
import type { OrderDiscount } from "./cart-math";

export interface CartLine {
  variantId: string;
  name: string;
  sku: string;
  unitPriceMinor: number;
  quantity: number;
  stock: number;
  unit: string;
}

export interface HeldOrder {
  id: string;
  label: string;
  at: string;
  lines: CartLine[];
  customer: PosCustomer | null;
  discount: OrderDiscount;
}

interface CartState {
  lines: CartLine[];
  customer: PosCustomer | null;
  discount: OrderDiscount;
  held: HeldOrder[];
}

type Action =
  | { type: "ADD"; product: PosProduct }
  | { type: "SET_QTY"; variantId: string; quantity: number }
  | { type: "REMOVE"; variantId: string }
  | { type: "SET_CUSTOMER"; customer: PosCustomer | null }
  | { type: "SET_DISCOUNT"; discount: OrderDiscount }
  | { type: "CLEAR" }
  | { type: "HOLD" }
  | { type: "RECALL"; id: string }
  | { type: "DELETE_HELD"; id: string };

const INITIAL: CartState = { lines: [], customer: null, discount: { kind: "none" }, held: [] };

function heldLabel(state: CartState): string {
  if (state.customer) return state.customer.name;
  const first = state.lines[0];
  if (!first) return "Held order";
  const extra = state.lines.length - 1;
  return extra > 0 ? `${first.name} +${extra}` : first.name;
}

export function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const { product } = action;
      const existing = state.lines.find((l) => l.variantId === product.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.variantId === product.id
              ? { ...l, quantity: Math.min(l.quantity + 1, Math.max(l.stock, 1)) }
              : l,
          ),
        };
      }
      const line: CartLine = {
        variantId: product.id,
        name: product.name,
        sku: product.sku,
        unitPriceMinor: product.price.amountMinor,
        quantity: 1,
        stock: product.stock,
        unit: product.unit,
      };
      return { ...state, lines: [...state.lines, line] };
    }
    case "SET_QTY": {
      const quantity = action.quantity;
      if (quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.variantId !== action.variantId) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.variantId === action.variantId
            ? { ...l, quantity: Math.min(quantity, Math.max(l.stock, 1)) }
            : l,
        ),
      };
    }
    case "REMOVE":
      return { ...state, lines: state.lines.filter((l) => l.variantId !== action.variantId) };
    case "SET_CUSTOMER":
      return { ...state, customer: action.customer };
    case "SET_DISCOUNT":
      return { ...state, discount: action.discount };
    case "CLEAR":
      return { ...state, lines: [], customer: null, discount: { kind: "none" } };
    case "HOLD": {
      if (state.lines.length === 0) return state;
      const held: HeldOrder = {
        id: crypto.randomUUID(),
        label: heldLabel(state),
        at: new Date().toISOString(),
        lines: state.lines,
        customer: state.customer,
        discount: state.discount,
      };
      return {
        ...state,
        lines: [],
        customer: null,
        discount: { kind: "none" },
        held: [held, ...state.held],
      };
    }
    case "RECALL": {
      const order = state.held.find((h) => h.id === action.id);
      if (!order) return state;
      return {
        ...state,
        lines: order.lines,
        customer: order.customer,
        discount: order.discount,
        held: state.held.filter((h) => h.id !== action.id),
      };
    }
    case "DELETE_HELD":
      return { ...state, held: state.held.filter((h) => h.id !== action.id) };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  add: (product: PosProduct) => void;
  setQty: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  setCustomer: (customer: PosCustomer | null) => void;
  setDiscount: (discount: OrderDiscount) => void;
  clear: () => void;
  hold: () => void;
  recall: (id: string) => void;
  deleteHeld: (id: string) => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(cartReducer, INITIAL);
  const value = React.useMemo<CartContextValue>(
    () => ({
      ...state,
      add: (product) => dispatch({ type: "ADD", product }),
      setQty: (variantId, quantity) => dispatch({ type: "SET_QTY", variantId, quantity }),
      remove: (variantId) => dispatch({ type: "REMOVE", variantId }),
      setCustomer: (customer) => dispatch({ type: "SET_CUSTOMER", customer }),
      setDiscount: (discount) => dispatch({ type: "SET_DISCOUNT", discount }),
      clear: () => dispatch({ type: "CLEAR" }),
      hold: () => dispatch({ type: "HOLD" }),
      recall: (id) => dispatch({ type: "RECALL", id }),
      deleteHeld: (id) => dispatch({ type: "DELETE_HELD", id }),
    }),
    [state],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
