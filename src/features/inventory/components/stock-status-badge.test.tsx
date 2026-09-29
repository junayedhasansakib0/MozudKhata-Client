import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockStatusBadge } from "@/features/inventory/components/stock-status-badge";

describe("StockStatusBadge", () => {
  it("labels each stock status", () => {
    const { rerender } = render(<StockStatusBadge status="IN_STOCK" />);
    expect(screen.getByText("In stock")).toBeInTheDocument();

    rerender(<StockStatusBadge status="LOW" />);
    expect(screen.getByText("Low")).toBeInTheDocument();

    rerender(<StockStatusBadge status="OUT" />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});
