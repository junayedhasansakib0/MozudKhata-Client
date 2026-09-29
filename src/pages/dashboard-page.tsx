import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button-variants";

/**
 * Placeholder landing page for Phase 01. Real dashboard metrics arrive in
 * Phase 07; for now it links into the inventory features shipped so far.
 */
export function DashboardPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Inventory &amp; stock management. Foundation is in place — features land phase
          by phase.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          Manage your catalogue from the Products area. Stock operations and dashboard
          metrics arrive in later phases.
        </p>
        <div className="mt-4 flex gap-2">
          <Link to="/products" className={buttonVariants()}>
            Go to products
          </Link>
          <Link to="/categories" className={buttonVariants({ variant: "outline" })}>
            Manage categories
          </Link>
        </div>
      </div>
    </section>
  );
}
