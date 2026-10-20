export const DASHBOARD_THEME_COOKIE = "boomotech-dashboard-theme";

export type DashboardTheme = "dark" | "light";

export function parseDashboardTheme(value: string | undefined): DashboardTheme {
  return value === "dark" ? "dark" : "light";
}
