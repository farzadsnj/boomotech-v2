export type FeaturedWorkRecord = {
  slug: string;
  title: string;
  summary: string;
  servicePaths: `/${string}`[];
  approved: boolean;
};

// Add owner-approved work here only after permission, scope and claims have been reviewed.
export const featuredWork: FeaturedWorkRecord[] = [];

export const featuredWorkFallback = {
  eyebrow: "Proof with permission",
  title: "Real work deserves accurate context.",
  description: "Project stories will appear here when the client, scope and outcomes have been approved for publication. Until then, explore how BoomoTech approaches practical technology work.",
  action: { label: "See how we work", href: "/about" as const }
};
