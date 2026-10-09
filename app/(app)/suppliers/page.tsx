import { Truck } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return (
    <PlaceholderPage
      eyebrow="Catalog & Supply"
      title="Suppliers"
      description="Supplier directory, purchase history, and outstanding balances."
      phase="Phase 7"
      icon={Truck}
    />
  );
}
