import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PermissionMatrix } from "./permission-matrix";

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("PermissionMatrix", () => {
  it("renders roles and permission rows from the mock adapter", async () => {
    render(withQuery(<PermissionMatrix />));
    expect(await screen.findByText("Cashier")).toBeInTheDocument();
    expect(screen.getByText("Store Manager")).toBeInTheDocument();
    expect(screen.getByText("Process refunds")).toBeInTheDocument();

    // Each permission exposes a per-role checkbox.
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Cashier: Process refunds" })).toBeInTheDocument();
    });
  });
});
