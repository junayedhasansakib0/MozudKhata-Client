import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { EmptyState } from "@/components/states/empty-state";

interface PlaceholderPageProps {
  eyebrow?: string;
  title: string;
  description: string;
  phase: string;
  icon?: ComponentType<LucideProps>;
}

/** Scaffold for routes whose full experience is built in a later phase. */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  phase,
  icon,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} — coming in ${phase}`}
        description="This surface is scaffolded in Phase 1 (foundation). Its full experience is built in a later phase per docs/implementation_plan.md."
      />
    </div>
  );
}
