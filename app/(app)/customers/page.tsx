import { Users } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <PlaceholderPage
      eyebrow="Catalog & Supply"
      title="Customers"
      description="Customer directory with loyalty tiers, credit limits, and balances."
      phase="Phase 8"
      icon={Users}
    />
  );
}
