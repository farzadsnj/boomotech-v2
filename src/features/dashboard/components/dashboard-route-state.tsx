"use client";

export function DashboardRouteState({ description = "Your account data has not been changed. Try loading the dashboard again.", kind, onRetry, title = "We could not load this page." }: { description?: string; kind: "error" | "loading"; onRetry?: () => void; title?: string }) {
  const loading = kind === "loading";
  return <div className="dashboard-shell dashboard-route-state-shell" data-dashboard-theme="light">
    <aside aria-hidden="true" className="dashboard-route-state__sidebar"><div className="dashboard-state-bar dashboard-state-bar--brand" /><div className="dashboard-state-bar" /><div className="dashboard-state-bar" /></aside>
    <div className="dashboard-route-state__main" id="dashboard-content">
      <div aria-busy={loading || undefined} aria-live="polite" className="dashboard-route-state" role={loading ? "status" : "alert"}>
        {loading ? <><div className="dashboard-state-bar dashboard-state-bar--heading" /><div className="dashboard-state-card-grid"><span /><span /><span /><span /><span /><span /></div><p>Loading your secure dashboard…</p></> : <><p className="eyebrow">Dashboard</p><h1>{title}</h1><p>{description}</p>{onRetry ? <button onClick={onRetry} type="button">Try again</button> : null}</>}
      </div>
    </div>
  </div>;
}
