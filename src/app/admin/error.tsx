"use client";

import { useEffect } from "react";
import { DashboardRouteState } from "@/features/dashboard/components/dashboard-route-state";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Administrator dashboard failed to render.", error.digest ?? "no-digest");
  }, [error.digest]);
  return <DashboardRouteState description="The request and customer records could not be retrieved. No operations data was changed. Try loading the dashboard again." kind="error" onRetry={reset} title="Operations data is temporarily unavailable." />;
}
