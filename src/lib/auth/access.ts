export function canAccessCustomerDashboard(session: { user: { id: string; emailVerified?: boolean } } | null) {
  return Boolean(session?.user.id && session.user.emailVerified);
}

export function canAccessAdminDashboard(session: { user: { role?: string | null } } | null) {
  return session?.user.role === "admin";
}
