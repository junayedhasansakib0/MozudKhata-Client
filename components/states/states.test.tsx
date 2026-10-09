import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

describe("state components", () => {
  it("PageHeader renders the title and description", () => {
    render(<PageHeader title="Inventory & Stock" description="Per-store stock" />);
    expect(screen.getByRole("heading", { name: "Inventory & Stock" })).toBeInTheDocument();
    expect(screen.getByText("Per-store stock")).toBeInTheDocument();
  });

  it("EmptyState renders its title", () => {
    render(<EmptyState title="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});
