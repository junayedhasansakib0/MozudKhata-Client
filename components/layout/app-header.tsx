import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { NotificationsButton } from "./notifications-button";
import { StoreSwitcher } from "./store-switcher";
import { SyncBadge } from "./sync-badge";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <MobileNav />
      <StoreSwitcher />
      <div className="ms-auto flex items-center gap-1.5">
        <CommandMenu className="me-1" />
        <SyncBadge className="hidden md:inline-flex" />
        <NotificationsButton />
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
