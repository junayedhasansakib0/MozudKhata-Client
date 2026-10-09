"use client";

import { Check, ChevronsUpDown, Store as StoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveStore } from "@/hooks/use-active-store";
import { useSession } from "@/hooks/use-session";

export function StoreSwitcher() {
  const { data: session, isLoading } = useSession();
  const { activeStoreId, setActiveStoreId } = useActiveStore();

  if (isLoading || !session) {
    return <div className="h-9 w-44 animate-pulse rounded-md bg-muted" />;
  }

  const currentId = activeStoreId ?? session.activeStoreId;
  const current = session.stores.find((store) => store.id === currentId) ?? session.stores[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <StoreIcon className="size-4 text-primary" />
          <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:block">
            {current?.name}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Stores &amp; Branches</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.stores.map((store) => (
          <DropdownMenuItem key={store.id} onSelect={() => setActiveStoreId(store.id)}>
            <StoreIcon className="size-4 text-muted-foreground" />
            <span className="flex-1">
              <span className="block text-sm font-medium leading-tight">{store.name}</span>
              <span className="block text-xs text-muted-foreground">
                {store.code} · {store.city}
              </span>
            </span>
            {store.id === current?.id ? <Check className="size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
