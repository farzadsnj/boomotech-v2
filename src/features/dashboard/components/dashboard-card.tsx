import type { ReactNode } from "react";
import Link from "next/link";

export function DashboardCard({ children, className = "", description, title, titleId }: { children: ReactNode; className?: string; description?: string; title: string; titleId: string }) {
  return <section aria-labelledby={titleId} className={`dashboard-card ${className}`.trim()}>
    <header className="dashboard-card__header"><div><h2 id={titleId}>{title}</h2>{description ? <p>{description}</p> : null}</div></header>
    <div className="dashboard-card__body">{children}</div>
  </section>;
}

export function DashboardMetricCard({ description, href, label, linkLabel, tone = "default", value }: { description?: string; href?: string; label: string; linkLabel?: string; tone?: "attention" | "default" | "positive"; value: number }) {
  const content = <><span className="dashboard-metric-card__label">{label}</span><strong>{value}</strong>{description ? <small>{description}</small> : null}</>;
  return <li className={`dashboard-metric-card dashboard-metric-card--${tone}`}>{href ? <Link aria-label={`${label}: ${value}. ${linkLabel ?? "View matching requests"}`} href={href}>{content}<span aria-hidden="true" className="dashboard-metric-card__arrow">→</span></Link> : <div>{content}</div>}</li>;
}

export function DashboardEmptyState({ description, title }: { description: string; title: string }) {
  return <div className="dashboard-empty-state"><span aria-hidden="true">—</span><h3>{title}</h3><p>{description}</p></div>;
}
