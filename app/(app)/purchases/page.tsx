import { ClipboardList } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Purchases & POs" };

export default function PurchasesPage() {
  return (
    <PlaceholderPage
      eyebrow="Catalog & Supply"
      title="Purchases & POs"
      description="Raise purchase orders and receive stock against suppliers."
      phase="Phase 7"
      icon={ClipboardList}
    />
  );
}
