import { BarChart3 } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Analytics & Reports" };

export default function ReportsPage() {
  return (
    <PlaceholderPage
      eyebrow="Operations & Finance"
      title="Analytics & Reports"
      description="Sales, profit, inventory, and tax reporting with filters and exports."
      phase="Phase 9"
      icon={BarChart3}
    />
  );
}
