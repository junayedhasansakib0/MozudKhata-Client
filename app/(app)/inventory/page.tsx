import { Boxes } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Inventory & Stock" };

export default function InventoryPage() {
  return (
    <PlaceholderPage
      eyebrow="Core Operations"
      title="Inventory & Stock"
      description="Per-store stock, audited adjustments, transfers, and the movement ledger."
      phase="Phase 6"
      icon={Boxes}
    />
  );
}
