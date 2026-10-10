"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/states/page-header";
import { useNotifications, notificationsQueryKey } from "@/hooks/use-notifications";
import { getDataSource } from "@/lib/data/provider";
import { toUserMessage } from "@/lib/data/errors";
import type { AppNotification, NotificationSeverity } from "@/lib/data/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY: Record<NotificationSeverity, { variant: "info" | "success" | "warning" | "destructive"; dot: string }> = {
  info: { variant: "info", dot: "bg-info" },
  success: { variant: "success", dot: "bg-success" },
  warning: { variant: "warning", dot: "bg-warning" },
  critical: { variant: "destructive", dot: "bg-destructive" },
};

export function NotificationsView() {
  const notificationsQuery = useNotifications();
  const qc = useQueryClient();
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const invalidate = () => void qc.invalidateQueries({ queryKey: notificationsQueryKey });
  const markRead = useMutation({
    mutationFn: (id: string) => getDataSource().notifications.markRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => getDataSource().notifications.markAllRead(),
    onSuccess: invalidate,
  });

  const all = notificationsQuery.data ?? [];
  const items = unreadOnly ? all.filter((n) => !n.read) : all;
  const unread = all.filter((n) => !n.read).length;

  async function readOne(n: AppNotification) {
    if (n.read) return;
    try {
      await markRead.mutateAsync(n.id);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Low-stock alerts, transfers, reorder drafts, and shift events."
        actions={
          <div className="flex items-center gap-2">
            <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => setUnreadOnly((v) => !v)}>
              Unread ({unread})
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending || unread === 0}>
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          </div>
        }
      />

      {notificationsQuery.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title={unreadOnly ? "No unread notifications" : "No notifications"} description="You're all caught up." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((n) => {
            const sev = SEVERITY[n.severity];
            return (
              <li key={n.id} className={cn("flex items-start gap-3 p-4", !n.read && "bg-primary/5")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", sev.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <Badge variant={sev.variant}>{n.severity}</Badge>
                    {!n.read ? <span className="text-[11px] font-semibold uppercase text-primary">New</span> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.read ? (
                  <Button variant="ghost" size="sm" onClick={() => readOne(n)} disabled={markRead.isPending}>
                    Mark read
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
