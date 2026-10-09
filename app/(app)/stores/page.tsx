import { Building2 } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Stores & Branches" };

export default function StoresPage() {
  return (
    <PlaceholderPage
      eyebrow="Operations & Finance"
      title="Stores & Branches"
      description="Manage store locations, status, and the store network."
      phase="Phase 10"
      icon={Building2}
    />
  );
}
