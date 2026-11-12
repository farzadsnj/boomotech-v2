"use client";

import { useEffect } from "react";
import { DashboardRouteState } from "@/features/dashboard/components/dashboard-route-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Customer dashboard failed to render.", error.digest ?? "no-digest");
  }, [error.digest]);
  return <DashboardRouteState kind="error" onRetry={reset} />;
}
