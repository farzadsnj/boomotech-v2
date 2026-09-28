export function canAccessCustomerDashboard(session: { user: { id: string } } | null) {
  return Boolean(session?.user.id);
}

export function canAccessAdminDashboard(session: { user: { role?: string | null } } | null) {
  return session?.user.role === "admin";
}
