export type DashboardRole = "admin" | "customer";

export type DashboardIconName = "account" | "calendar" | "customers" | "home" | "notifications" | "reports" | "requests" | "security" | "support";

export type DashboardNavigationItem = {
  href: string;
  icon: DashboardIconName;
  label: string;
  matchPrefixes?: string[];
};

export type DashboardNavigationGroup = {
  label: string;
  items: DashboardNavigationItem[];
};

export const dashboardNavigation: Record<DashboardRole, DashboardNavigationGroup[]> = {
  admin: [
    {
      label: "Workspace",
      items: [
        { href: "/admin", icon: "home", label: "Overview" },
        { href: "/admin#request-list", icon: "requests", label: "Request queue", matchPrefixes: ["/admin/requests/"] },
        { href: "/admin/customers", icon: "customers", label: "Customers", matchPrefixes: ["/admin/customers/"] },
        { href: "/admin/calendar", icon: "calendar", label: "Activity calendar" },
        { href: "/admin/reports", icon: "reports", label: "Reports" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/admin/settings", icon: "account", label: "Account settings" },
        { href: "/notifications", icon: "notifications", label: "Notifications" },
        { href: "/admin/mfa/recovery", icon: "security", label: "Security settings" },
      ],
    },
  ],
  customer: [
    {
      label: "Workspace",
      items: [
        { href: "/dashboard", icon: "home", label: "Overview" },
        { href: "/dashboard#customer-requests", icon: "requests", label: "My requests" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/settings", icon: "account", label: "Account settings" },
        { href: "/notifications", icon: "notifications", label: "Notifications" },
      ],
    },
    {
      label: "Support",
      items: [
        { href: "/booking", icon: "requests", label: "New request" },
        { href: "/dashboard/help", icon: "support", label: "Help" },
      ],
    },
  ],
};

function splitHref(href: string) {
  const [pathname, fragment = ""] = href.split("#");
  return { pathname, hash: fragment ? `#${fragment}` : "" };
}

export function isDashboardNavigationItemActive(pathname: string, hash: string, item: DashboardNavigationItem) {
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
  const target = splitHref(item.href);
  if (pathname !== target.pathname) return false;
  if (target.hash) return hash === target.hash;

  const siblingFragments = Object.values(dashboardNavigation)
    .flatMap((groups) => groups.flatMap((group) => group.items))
    .filter((candidate) => splitHref(candidate.href).pathname === pathname)
    .map((candidate) => splitHref(candidate.href).hash)
    .filter(Boolean);
  return !siblingFragments.includes(hash);
}
