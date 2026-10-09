import { ShieldCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Staff & Roles" };

export default function StaffPage() {
  return (
    <PlaceholderPage
      eyebrow="Operations & Finance"
      title="Staff & Roles"
      description="Employees, roles, and the permission matrix (RBAC)."
      phase="Phase 10"
      icon={ShieldCheck}
    />
  );
}
