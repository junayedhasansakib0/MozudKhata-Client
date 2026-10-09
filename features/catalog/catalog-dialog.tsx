"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandsManager } from "./brands/brands-manager";
import { CategoriesManager } from "./categories/categories-manager";

interface CatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatalogDialog({ open, onOpenChange }: CatalogDialogProps) {
  const [tab, setTab] = React.useState("categories");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Categories &amp; brands</DialogTitle>
          <DialogDescription>Organize the catalog taxonomy for this tenant.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
          </TabsList>
          <div className="pt-4">
            <TabsContent value="categories">
              <CategoriesManager />
            </TabsContent>
            <TabsContent value="brands">
              <BrandsManager />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
