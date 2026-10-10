import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Store } from "@/lib/data/types";
import { ExpenseFormDialog } from "./expense-form-dialog";

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

const stores: Store[] = [
  { id: "store_downtown", name: "Downtown Flagship", code: "AUS-01", city: "Austin", currency: "USD", status: "active" },
];

describe("ExpenseFormDialog", () => {
  it("validates a positive amount before saving", () => {
    render(withQuery(<ExpenseFormDialog open onOpenChange={vi.fn()} expense={null} stores={stores} defaultStoreId="store_downtown" />));
    fireEvent.click(screen.getByRole("button", { name: "Record expense" }));
    expect(screen.getByText("Enter an amount greater than zero.")).toBeInTheDocument();
  });

  it("accepts a valid amount (clears the validation error)", () => {
    render(withQuery(<ExpenseFormDialog open onOpenChange={vi.fn()} expense={null} stores={stores} defaultStoreId="store_downtown" />));
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Record expense" }));
    expect(screen.queryByText("Enter an amount greater than zero.")).not.toBeInTheDocument();
  });
});
