import { Bell } from "lucide-react";

import { PlaceholderPage } from "@/components/states/placeholder-page";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      eyebrow="Activity"
      title="Notifications"
      description="Your notification center with read/unread states."
      phase="Phase 10"
      icon={Bell}
    />
  );
}
