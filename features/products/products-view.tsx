"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FolderTree, Package, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { toUserMessage } from "@/lib/data/errors";
import type { BulkPriceAdjustment, Product } from "@/lib/data/types";
import { CatalogDialog } from "@/features/catalog/catalog-dialog";
import { useBrands, useCategories, useTaxRates } from "@/features/catalog/use-catalog";

import { toCatalogCsv } from "./catalog-math";
import { CatalogKpis } from "./catalog-kpis";
import { BulkActionsBar } from "./bulk-actions-bar";
import { BulkCategoryDialog } from "./bulk-category-dialog";
import { BulkPriceDialog } from "./bulk-price-dialog";
import { BarcodeLabelsDialog } from "./barcode-labels-dialog";
import { ImportDialog } from "./import-dialog";
import { ProductDetailSheet } from "./product-detail-sheet";
import { ProductFilters, DEFAULT_FILTERS, type ProductFilterValues } from "./product-filters";
import { ProductFormSheet } from "./product-form-sheet";
import { ProductsTable } from "./products-table";
import { useCatalogSummary, useProductMutations, useProducts } from "./use-products";

type DialogKind = "none" | "price" | "category" | "labels" | "import" | "catalog" | "deactivate";

export function ProductsView() {
  const [filters, setFilters] = React.useState<ProductFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [dialog, setDialog] = React.useState<DialogKind>("none");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [detail, setDetail] = React.useState<Product | null>(null);

  const listParams = {
    q: filters.q || undefined,
    categoryId: filters.categoryId || undefined,
    brandId: filters.brandId || undefined,
    status: filters.status,
    sort: filters.sort,
    page,
    pageSize,
  };

  const listQuery = useProducts(listParams);
  const summaryQuery = useCatalogSummary();
  const allQuery = useProducts({ page: 1, pageSize: 1000, status: "all" });
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();
  const taxRatesQuery = useTaxRates();
  const mutations = useProductMutations();

  const products = listQuery.data?.data ?? [];
  const allProducts = React.useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);
  const categories = categoriesQuery.data ?? [];
  const brands = brandsQuery.data ?? [];
  const taxRates = taxRatesQuery.data ?? [];

  const knownSkus = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) for (const v of p.variants) set.add(v.sku.toLowerCase());
    return set;
  }, [allProducts]);

  const selectedProducts = React.useMemo(
    () => allProducts.filter((p) => selectedIds.has(p.id)),
    [allProducts, selectedIds],
  );

  function patchFilters(patch: Partial<ProductFilterValues>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const pageIds = products.map((p) => p.id);
    const allOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setDetail(null);
    setEditing(product);
    setFormOpen(true);
  }

  async function toggleStatus(product: Product) {
    try {
      await mutations.setStatus.mutateAsync({
        id: product.id,
        status: product.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function applyBulkPrice(adjustment: BulkPriceAdjustment) {
    try {
      const n = await mutations.bulkPrice.mutateAsync({ ids: [...selectedIds], adjustment });
      toast.success(`Updated pricing on ${n} products`);
      setDialog("none");
      clearSelection();
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function applyBulkCategory(categoryId: string) {
    try {
      const n = await mutations.bulkCategory.mutateAsync({ ids: [...selectedIds], categoryId });
      toast.success(`Moved ${n} products`);
      setDialog("none");
      clearSelection();
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  async function applyBulkDeactivate() {
    try {
      const n = await mutations.bulkDeactivate.mutateAsync([...selectedIds]);
      toast.success(`Deactivated ${n} products`);
      setDialog("none");
      clearSelection();
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  function exportCsv() {
    const csv = toCatalogCsv(allProducts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mozudkhata-catalog.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Catalog exported");
  }

  const total = listQuery.data?.total ?? 0;
  const loading = listQuery.isLoading;
  const filtered =
    filters.q !== "" ||
    filters.categoryId !== "" ||
    filters.brandId !== "" ||
    filters.status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog &amp; Supply"
        title="Products &amp; Variants"
        description="Centralized catalog with the variant matrix, SKUs, barcodes, and pricing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialog("import")}>
              <Upload className="size-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("catalog")}>
              <FolderTree className="size-4" />
              <span className="hidden sm:inline">Categories &amp; brands</span>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Add product
            </Button>
          </div>
        }
      />

      <CatalogKpis summary={summaryQuery.data} loading={summaryQuery.isLoading} />

      <ProductFilters
        values={filters}
        categories={categories}
        brands={brands}
        onChange={patchFilters}
        onClear={() => {
          setFilters(DEFAULT_FILTERS);
          setPage(1);
        }}
      />

      <BulkActionsBar
        count={selectedIds.size}
        onUpdatePrice={() => setDialog("price")}
        onChangeCategory={() => setDialog("category")}
        onPrintLabels={() => setDialog("labels")}
        onDeactivate={() => setDialog("deactivate")}
        onClear={clearSelection}
      />

      {listQuery.isError ? (
        <ErrorState error={listQuery.error} onRetry={() => listQuery.refetch()} />
      ) : loading ? (
        <Skeleton className="h-96 w-full" />
      ) : total === 0 ? (
        <EmptyState
          icon={Package}
          title={filtered ? "No products match your filters" : "No products yet"}
          description={
            filtered
              ? "Try a different search or clear the filters."
              : "Add your first product to start building the catalog."
          }
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add product
              </Button>
            )
          }
        />
      ) : (
        <ProductsTable
          products={products}
          total={total}
          page={page}
          pageSize={pageSize}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={setDetail}
          onEdit={openEdit}
          onToggleStatus={toggleStatus}
        />
      )}

      {formOpen ? (
        <ProductFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          product={editing}
          categories={categories}
          brands={brands}
          taxRates={taxRates}
        />
      ) : null}

      <ProductDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        product={detail}
        onEdit={openEdit}
      />

      {dialog === "price" ? (
        <BulkPriceDialog
          open
          onOpenChange={(open) => !open && setDialog("none")}
          count={selectedIds.size}
          pending={mutations.bulkPrice.isPending}
          onApply={applyBulkPrice}
        />
      ) : null}
      {dialog === "category" ? (
        <BulkCategoryDialog
          open
          onOpenChange={(open) => !open && setDialog("none")}
          count={selectedIds.size}
          categories={categories}
          pending={mutations.bulkCategory.isPending}
          onApply={applyBulkCategory}
        />
      ) : null}
      {dialog === "labels" ? (
        <BarcodeLabelsDialog
          open
          onOpenChange={(open) => !open && setDialog("none")}
          products={selectedProducts}
        />
      ) : null}
      {dialog === "import" ? (
        <ImportDialog
          open
          onOpenChange={(open) => !open && setDialog("none")}
          knownSkus={knownSkus}
        />
      ) : null}
      <CatalogDialog
        open={dialog === "catalog"}
        onOpenChange={(open) => !open && setDialog("none")}
      />
      <Dialog open={dialog === "deactivate"} onOpenChange={(open) => !open && setDialog("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Deactivate {selectedIds.size} {selectedIds.size === 1 ? "product" : "products"}?
            </DialogTitle>
            <DialogDescription>
              Deactivated products are hidden from new sales but keep their history (soft delete in
              the mock catalog). You can reactivate them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog("none")}
              disabled={mutations.bulkDeactivate.isPending}
            >
              Keep active
            </Button>
            <Button
              variant="destructive"
              onClick={applyBulkDeactivate}
              disabled={mutations.bulkDeactivate.isPending}
            >
              {mutations.bulkDeactivate.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
