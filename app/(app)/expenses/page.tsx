import { Wallet } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Expenses & Cashflow" };

export default function ExpensesPage() {
  return (
    <PlaceholderPage
      eyebrow="Operations & Finance"
      title="Expenses & Cashflow"
      description="Record store expenses and reconcile cash-drawer shifts."
      phase="Phase 9"
      icon={Wallet}
    />
  );
}
