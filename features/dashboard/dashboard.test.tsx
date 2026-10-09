import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { KpiCard } from "./kpi-card";
import { CategoryBreakdown } from "./category-breakdown";
import { DateRangeFilter } from "./date-range-filter";

describe("dashboard widgets", () => {
  it("KpiCard renders label, value, and delta", () => {
    render(<KpiCard label="Net profit" value="$5,837.00" deltaPct={14.2} spark={[1, 2, 3, 4]} />);
    expect(screen.getByText("Net profit")).toBeInTheDocument();
    expect(screen.getByText("$5,837.00")).toBeInTheDocument();
    expect(screen.getByText("14.2%")).toBeInTheDocument();
  });

  it("CategoryBreakdown lists each category", () => {
    render(
      <CategoryBreakdown
        data={[
          { category: "Food", amount: 1000 },
          { category: "Drinks", amount: 3000 },
        ]}
      />,
    );
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Drinks")).toBeInTheDocument();
  });

  it("DateRangeFilter emits the selected range", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter value="today" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(onChange).toHaveBeenCalledWith("30d");
  });
});
