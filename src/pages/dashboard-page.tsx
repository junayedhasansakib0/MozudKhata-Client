/**
 * Placeholder landing page for Phase 01. Real dashboard metrics arrive in
 * Phase 07; for now this confirms the app shell, routing, and styling work.
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
          The API status badge in the header reflects a live call to the backend health
          endpoint. Authentication, products, and stock operations are coming in the next
          phases.
        </p>
      </div>
    </section>
  );
}
