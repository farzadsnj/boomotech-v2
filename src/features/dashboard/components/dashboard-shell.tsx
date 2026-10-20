"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationCentre } from "@/features/notifications/components/notification-centre";
import { dashboardNavigation, isDashboardNavigationItemActive, type DashboardRole } from "../navigation";
import { DASHBOARD_THEME_COOKIE, type DashboardTheme } from "../theme";
import { DashboardIcon } from "./dashboard-icon";

export type DashboardBreadcrumb = { href?: string; label: string };

type DashboardUser = {
  email: string;
  name: string;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BT";
}

export function DashboardShell({ breadcrumbs, children, initialTheme, role, user }: { breadcrumbs: DashboardBreadcrumb[]; children: ReactNode; initialTheme: DashboardTheme; role: DashboardRole; user: DashboardUser }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>(initialTheme);
  const drawer = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const accountMenu = useRef<HTMLDetailsElement>(null);
  const groups = dashboardNavigation[role];
  const dashboardHome = role === "admin" ? "/admin" : "/dashboard";
  const accountHref = role === "admin" ? "/admin/settings" : "/dashboard/settings";

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
    drawer.current?.querySelector<HTMLElement>("nav a[href]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        requestAnimationFrame(() => menuButton.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accountMenu.current?.open) {
        accountMenu.current.open = false;
        accountMenu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${DASHBOARD_THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }

  const navigation = <nav aria-label={`${role === "admin" ? "Administrator" : "Customer"} dashboard`} className="dashboard-navigation">
    {groups.map((group) => <div className="dashboard-navigation__group" key={group.label}>
      <p>{group.label}</p>
      <ul>{group.items.map((item) => {
        const active = isDashboardNavigationItemActive(pathname, hash, item);
        return <li key={item.href}><Link aria-current={active ? "page" : undefined} href={item.href} onClick={() => setDrawerOpen(false)} title={collapsed ? item.label : undefined}><DashboardIcon name={item.icon} /><span>{item.label}</span></Link></li>;
      })}</ul>
    </div>)}
  </nav>;

  return <div className={`dashboard-shell${collapsed ? " is-collapsed" : ""}${drawerOpen ? " is-drawer-open" : ""}`} data-dashboard-theme={theme}>
    <a className="dashboard-skip-link" href="#dashboard-content">Skip to dashboard content</a>
    <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
      <div className="dashboard-sidebar__brand">
        <Link aria-label="BoomoTech dashboard home" href={dashboardHome}><Image alt="" aria-hidden="true" height={512} priority src="/brand/boomotech-mark.png" width={512} /><span><strong>BoomoTech</strong><small>{role === "admin" ? "Administrator" : "Customer"} portal</small></span></Link>
        <button aria-label={collapsed ? "Expand dashboard navigation" : "Collapse dashboard navigation"} aria-pressed={collapsed} className="dashboard-sidebar__collapse" onClick={() => setCollapsed((value) => !value)} type="button"><DashboardIcon name="chevron" /></button>
      </div>
      {navigation}
      <div className="dashboard-sidebar__support"><p>Need the public website?</p><Link href="/">Return to BoomoTech</Link></div>
    </aside>

    <button aria-hidden={!drawerOpen} aria-label="Close dashboard navigation" className="dashboard-drawer-backdrop" inert={!drawerOpen} onClick={() => { setDrawerOpen(false); menuButton.current?.focus(); }} tabIndex={drawerOpen ? 0 : -1} type="button" />
    <aside aria-hidden={!drawerOpen} aria-label="Dashboard menu" aria-modal="true" className="dashboard-mobile-drawer" id="dashboard-mobile-drawer" inert={!drawerOpen} ref={drawer} role="dialog">
      <div className="dashboard-mobile-drawer__header"><strong>Menu</strong><button aria-label="Close dashboard navigation" onClick={() => { setDrawerOpen(false); menuButton.current?.focus(); }} type="button"><DashboardIcon name="close" /></button></div>
      {navigation}
      <Link className="dashboard-mobile-drawer__public-link" href="/">Return to BoomoTech website</Link>
    </aside>

    <div className="dashboard-workspace">
      <header className="dashboard-topbar">
        <button aria-controls="dashboard-mobile-drawer" aria-expanded={drawerOpen} aria-label="Open dashboard navigation" className="dashboard-menu-button" onClick={() => setDrawerOpen(true)} ref={menuButton} type="button"><DashboardIcon name="menu" /></button>
        <nav aria-label="Breadcrumb" className="dashboard-breadcrumbs"><ol>{breadcrumbs.map((item, index) => <li key={`${item.label}-${index}`}>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>
        <div className="dashboard-topbar__actions">
          <NotificationCentre />
          <button aria-label={`Use ${theme === "light" ? "dark" : "light"} dashboard theme`} aria-pressed={theme === "dark"} className="dashboard-theme-toggle" onClick={toggleTheme} type="button"><DashboardIcon name={theme === "light" ? "moon" : "sun"} /><span>{theme === "light" ? "Dark" : "Light"} theme</span></button>
          <details className="dashboard-account-menu" ref={accountMenu}>
            <summary aria-label={`Open account menu for ${user.name}`}><span className="dashboard-account-menu__avatar" aria-hidden="true">{initials(user.name)}</span><span className="dashboard-account-menu__identity"><strong>{user.name}</strong><small>{role === "admin" ? "Administrator" : "Customer account"}</small></span><DashboardIcon name="chevron" /></summary>
            <div className="dashboard-account-menu__panel"><p><strong>{user.name}</strong><span>{user.email}</span></p><Link href={accountHref}>Account settings</Link>{role === "admin" ? <Link href="/admin/mfa/recovery">MFA recovery codes</Link> : null}<SignOutButton admin={role === "admin"} /></div>
          </details>
        </div>
      </header>
      <div className="dashboard-content" id="dashboard-content" tabIndex={-1}>{children}</div>
    </div>
  </div>;
}
