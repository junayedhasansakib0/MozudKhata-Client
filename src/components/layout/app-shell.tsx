import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ApiStatus } from "@/components/api-status";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

/**
 * Top-level application chrome for authenticated pages: header with brand, live
 * API status, the current user, and account/logout controls; a main region
 * where routed pages render.
 */
export function AppShell() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const onLogout = async () => {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm transition-colors hover:text-foreground",
      isActive ? "font-medium text-foreground" : "text-muted-foreground",
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              MozudKhata
            </Link>
            <nav className="flex items-center gap-4">
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
              <NavLink to="/categories" className={navLinkClass}>
                Categories
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ApiStatus />
            {user && (
              <>
                <Link
                  to="/profile"
                  className="max-w-[12rem] truncate text-sm text-muted-foreground hover:text-foreground"
                  title={user.email}
                >
                  {user.name ?? user.email}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  disabled={logout.isPending}
                >
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
