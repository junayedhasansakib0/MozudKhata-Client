import { Link } from "react-router-dom";

/** Catch-all 404 page for unknown client routes. */
export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Back to dashboard
      </Link>
    </section>
  );
}
