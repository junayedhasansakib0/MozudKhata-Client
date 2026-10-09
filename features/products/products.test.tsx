import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import type { Product } from "@/lib/data/types";
import { VariantMatrixEditor } from "./variant-matrix-editor";
import { ProductsTable } from "./products-table";
import { ImportDialog } from "./import-dialog";
import { blankVariant, type VariantDraft } from "./form-model";

function EditorHarness() {
  const [variants, setVariants] = React.useState<VariantDraft[]>([blankVariant()]);
  return <VariantMatrixEditor baseSku="MC-100" variants={variants} onChange={setVariants} />;
}

function sampleProduct(id: string, name: string): Product {
  return {
    id,
    name,
    categoryId: "c1",
    categoryName: "Coffee",
    isVariable: false,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    variants: [
      {
        id: `${id}-v1`,
        productId: id,
        sku: `${id}-SKU`,
        barcode: "123",
        variantName: "Default",
        costPrice: { amountMinor: 500, currency: "USD" },
        sellPrice: { amountMinor: 1000, currency: "USD" },
        unit: "each",
        attributes: {},
        reorderThreshold: 10,
        reorderQuantity: 24,
        status: "active",
        stockByStore: [{ storeId: "s1", storeName: "Downtown Flagship", quantity: 20 }],
      },
    ],
  };
}

describe("VariantMatrixEditor", () => {
  it("generates variants from option values", () => {
    render(<EditorHarness />);
    // Starts with a single default variant.
    expect(screen.getAllByLabelText(/Variant \d+ name/)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    fireEvent.change(screen.getByLabelText("Option 1 name"), { target: { value: "Size" } });

    const valueInput = screen.getByLabelText("Add value to option 1");
    fireEvent.change(valueInput, { target: { value: "12oz" } });
    fireEvent.keyDown(valueInput, { key: "Enter" });
    fireEvent.change(valueInput, { target: { value: "16oz" } });
    fireEvent.keyDown(valueInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: /Generate variants/ }));

    const names = screen.getAllByLabelText(/Variant \d+ name/) as HTMLInputElement[];
    expect(names).toHaveLength(2);
    expect(names.map((n) => n.value)).toEqual(["12oz", "16oz"]);
  });
});

describe("ProductsTable selection", () => {
  const products = [sampleProduct("p1", "Flat White"), sampleProduct("p2", "Latte")];
  const baseProps = {
    products,
    total: 2,
    page: 1,
    pageSize: 25,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onToggleStatus: vi.fn(),
  };

  it("toggles a single row and the select-all header", () => {
    const onToggleSelect = vi.fn();
    const onToggleAll = vi.fn();
    render(
      <ProductsTable
        {...baseProps}
        selectedIds={new Set()}
        onToggleSelect={onToggleSelect}
        onToggleAll={onToggleAll}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Flat White" }));
    expect(onToggleSelect).toHaveBeenCalledWith("p1");

    fireEvent.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
    expect(onToggleAll).toHaveBeenCalled();
  });

  it("marks the header checkbox mixed when some rows are selected", () => {
    render(
      <ProductsTable
        {...baseProps}
        selectedIds={new Set(["p1"])}
        onToggleSelect={vi.fn()}
        onToggleAll={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Select all on this page" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });
});

describe("ImportDialog validation preview", () => {
  it("classifies create, update, and error rows from pasted CSV", () => {
    render(<ImportDialog open onOpenChange={vi.fn()} knownSkus={new Set(["old-1"])} />);

    const csv = [
      "name,sku,sell",
      "New Item,NEW-1,10.00",
      "Existing,OLD-1,5.00",
      ",BAD-1,notanumber",
    ].join("\n");
    fireEvent.change(screen.getByLabelText("CSV content"), { target: { value: csv } });

    expect(screen.getByText("1 to create")).toBeInTheDocument();
    expect(screen.getByText("1 to update")).toBeInTheDocument();
    expect(screen.getByText("1 with errors")).toBeInTheDocument();
    // The error row surfaces its issues in the preview table.
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/must be a number/i)).toBeInTheDocument();
  });
});
