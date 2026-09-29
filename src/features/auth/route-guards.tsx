import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "./hooks";

function AuthPending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <span className="text-sm">Loading…</span>
    </div>
  );
}

/** Route guard: renders protected children only for an authenticated user. */
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <AuthPending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Inverse guard: keeps authenticated users off the login/register pages. */
export function RedirectIfAuthed() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <AuthPending />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
