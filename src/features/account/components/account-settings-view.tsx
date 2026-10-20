import Link from "next/link";
import { SignOutAllDevicesButton } from "@/components/auth/sign-out-button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import type { DashboardRole } from "@/features/dashboard/navigation";
import { PasswordChangeForm } from "./password-change-form";
import { ProfileSettingsForm } from "./profile-settings-form";

type SettingsUser = { email: string; emailVerified: boolean; name: string; username?: string | null };

export function AccountSettingsView({ role, user }: { role: DashboardRole; user: SettingsUser }) {
  const administrator = role === "admin";
  return <main className="dashboard-settings-page">
    <header className="dashboard-settings-page__header"><p className="eyebrow"><span className="eyebrow-line" />Account</p><h1>Account settings</h1><p>Review your account details, update your supported profile information and manage sign-in security.</p></header>

    <div className="dashboard-settings-grid">
      <DashboardCard className="dashboard-settings-overview" description="Sensitive credentials and security secrets are never displayed." title="Current account" titleId="current-account-title">
        <dl>
          <div><dt>Name</dt><dd>{user.name}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Email status</dt><dd><span className="customer-account-verified"><span aria-hidden="true">✓</span>{user.emailVerified ? "Verified" : "Verification required"}</span></dd></div>
          {administrator ? <><div><dt>Username</dt><dd>{user.username ?? "Configured administrator"}</dd></div><div><dt>Access</dt><dd>Administrator with mandatory MFA</dd></div></> : <div><dt>Access</dt><dd>Customer account</dd></div>}
        </dl>
        <p className="dashboard-settings-overview__notice">Email changes are unavailable until a separately reviewed re-verification workflow is implemented.</p>
      </DashboardCard>

      <DashboardCard description="Only your display name can be edited through this form." title="Profile details" titleId="profile-details-title"><ProfileSettingsForm initialName={user.name} /></DashboardCard>
      <DashboardCard description="Better Auth verifies your current password and applies the existing password policy." title="Change password" titleId="change-password-title"><PasswordChangeForm /></DashboardCard>
      <DashboardCard className="dashboard-settings-security" description="Review protected controls and active sessions." title="Security and sessions" titleId="security-sessions-title">
        {administrator ? <div className="dashboard-settings-security__mfa"><span aria-hidden="true">✓</span><div><strong>Multi-factor authentication is required</strong><p>Ordinary profile forms cannot disable MFA, change roles or alter administrator recovery policy.</p></div></div> : <div className="dashboard-settings-security__mfa"><span aria-hidden="true">✓</span><div><strong>Verified account</strong><p>Your verified email remains required for dashboard access.</p></div></div>}
        <div className="dashboard-settings-security__links">
          {administrator ? <Link href="/admin/mfa/recovery">Replace MFA recovery codes</Link> : null}
          <Link href="/notifications">Review notifications</Link>
          <Link href="/forgot-password">Password recovery</Link>
        </div>
        <div className="dashboard-settings-signout"><h3>Sign out every device</h3><p>Revokes every active session for this account, including this browser.</p><SignOutAllDevicesButton /></div>
      </DashboardCard>
    </div>
  </main>;
}
