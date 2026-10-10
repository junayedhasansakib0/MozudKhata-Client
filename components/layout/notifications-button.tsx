"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationSeverity } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-destructive",
};

export function NotificationsButton() {
  const { data = [] } = useNotifications();
  const unread = data.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive-fill text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <span className="text-xs font-normal text-muted-foreground">{unread} unread</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&rsquo;re all caught up.
          </p>
        ) : (
          data.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 whitespace-normal">
              <span className="flex w-full items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", SEVERITY_DOT[n.severity])} />
                <span className="flex-1 text-sm font-medium leading-tight">{n.title}</span>
                {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
              </span>
              <span className="ps-4 text-xs text-muted-foreground">{n.body}</span>
              <span className="ps-4 text-[11px] text-muted-foreground">
                {formatRelativeTime(n.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm font-medium text-primary">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
