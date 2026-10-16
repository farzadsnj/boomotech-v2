export function canAccessCustomerDashboard(session: { user: { id: string; emailVerified?: boolean } } | null) {
  return Boolean(session?.user.id && session.user.emailVerified);
}

export function isAdministrator(session: { user: { role?: string | null } } | null) {
  return session?.user.role === "admin";
}

export function canAccessAdminDashboard(session: { user: { role?: string | null; twoFactorEnabled?: boolean | null } } | null) {
  return isAdministrator(session) && session?.user.twoFactorEnabled === true;
}
