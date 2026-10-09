import { ReceiptText } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Sales & Orders" };

export default function SalesPage() {
  return (
    <PlaceholderPage
      eyebrow="Core Operations"
      title="Sales & Orders"
      description="Order history, invoices, and refunds across every terminal."
      phase="Phase 8"
      icon={ReceiptText}
    />
  );
}
