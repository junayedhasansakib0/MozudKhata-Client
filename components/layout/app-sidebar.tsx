import Link from "next/link";
import { Settings } from "lucide-react";

import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { SyncBadge } from "./sync-badge";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-card lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Brand />
      </div>
      <SidebarNav />
      <div className="space-y-2 border-t border-border px-3 py-3">
        <div className="px-3">
          <SyncBadge />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
