import { Settings } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Configuration"
      title="Settings"
      description="Business, currency, tax, invoice, payments, security, and appearance."
      phase="Phase 10"
      icon={Settings}
    />
  );
}
