# Authentication remediation — 13 October 2026

Status: implemented and locally testable on `security/application-hardening-2026`; not committed, deployed or migrated in production.

## Persistent login lockout (A3)

`auth_login_guard` stores an HMAC-SHA-256 identifier, the failure count, the start of the failure window and the lock expiry. Email addresses and usernames are not stored in this table. The SQL upsert increments atomically, so concurrent requests and multiple application instances use the same PostgreSQL state.

The existing maintenance command removes unlocked/expired guard rows only after `MAINTENANCE_LOGIN_GUARD_DAYS` (30 by default), which bounds stale identifiers without deleting an active lock.

The owner-approved project policy is five invalid password attempts within 15 minutes followed by a 15-minute lock. The response remains the same Better Auth invalid-credential response while locked. Expired locks allow a new attempt, and a completed sign-in clears the row. For an account with MFA, the row is cleared only after successful TOTP or recovery-code verification. A database read/write failure fails the authentication request closed; any session created before a failed reset operation is invalidated.

Better Auth's PostgreSQL rate limiter remains active as a complementary per-client control. In production it accepts only `CF-Connecting-IP`. This is safe only while Cloudflare Tunnel is the sole public path and Nginx/Cloudflare overwrite that header. Next.js must remain bound to loopback and the origin must not be directly reachable. Development uses `X-Forwarded-For`/`X-Real-IP` for isolated local tests.

## Mandatory administrator MFA (A15)

Better Auth 1.7.6 supplies TOTP and encrypted recovery-code storage. The migration adds `user.two_factor_enabled` and the `two_factor` table. TOTP secrets and recovery codes are encrypted with `BETTER_AUTH_SECRET`; they are never written to logs, browser storage or analytics.

Administrator access requires both `role=admin` and `twoFactorEnabled=true` on every server-rendered admin page and administrator request API. Better Auth administrator endpoints also reject an administrator session without MFA. Password-only sessions cannot reach privileged features. The challenge cookie lasts five minutes, trusted-device persistence is effectively disabled, and five invalid second-factor attempts cause Better Auth's 15-minute factor lockout.

Existing administrators are redirected to `/admin/mfa/setup`. Enrolment requires the current password, provides a QR code and manual Base32 key, shows ten single-use recovery codes once, and requires a valid TOTP before privileged access. Enrolment revokes pre-existing sessions. Recovery-code regeneration requires the password, replaces all previous codes and invalidates administrator sessions. The administrator MFA disable endpoint is blocked.

## Database migration

Migration: `drizzle/0005_mushy_bedlam.sql`.

Proposed production sequence after owner approval:

1. Complete and verify a protected PostgreSQL backup.
2. Put the application into an approved maintenance window.
3. Run `pnpm install --frozen-lockfile` and `pnpm prod:check` with the protected production environment.
4. Run `pnpm db:migrate` once.
5. Restart `boomotech.service` and complete local/public health checks.
6. Sign in as each administrator and complete `/admin/mfa/setup` before normal administration resumes.

The migration is additive. Rollback should restore the pre-migration database backup and the matching application revision together. Do not drop `two_factor`, `auth_login_guard`, or `user.two_factor_enabled` independently while the new application is running.

## Administrator bootstrap and recovery

`pnpm admin:seed` reads `ADMIN_USERNAME`, `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD` from the protected environment. It resets the selected administrator's sessions and MFA enrolment, then requires fresh setup on next sign-in. Remove the temporary password from the environment immediately after use.

Lost-device recovery uses one saved recovery code at `/admin/mfa`. If no recovery code remains, use the owner-approved identity recovery process and rerun the protected administrator seed command during a controlled maintenance window. This deliberately invalidates current sessions and existing factors.

## SEC-017 and CodeQL High

SEC-017 was caused by Zod `.max(128)` counting UTF-16 code units in login forms while account creation counted Unicode code points. Login and administrator login now reuse code-point-aware maximum validation. Regression coverage accepts 128 supplementary Unicode characters and rejects 129.

GitHub check run `114418909498` on commit `c706d7cc6c4439f51063a7ebe284ba47a7cb3511` reported CodeQL rule `js/insufficient-password-hash` at the custom SHA-1 call in `src/lib/auth/breached-password.ts`. That SHA-1 was used only for HIBP's k-anonymous range protocol, not password storage, but it was still an application-level CodeQL sink. The custom implementation has been removed. Better Auth's maintained `haveIBeenPwned` plugin now performs the protocol, while BoomoTech continues to hash stored passwords with Argon2id.

The GitHub alert cannot be confirmed closed until these changes are committed/pushed and CodeQL reruns. Do not dismiss the alert or lower the scanner threshold.

## Verification scope

Automated coverage includes lockout threshold, expiry, atomic concurrent failures, reset after success, generic responses, database-backed IP throttling, TOTP enrolment/challenge, pre-enrolment session invalidation, expired challenge rejection, direct administrator endpoint denial and recovery-code replay rejection. The isolated Playwright database enrols its synthetic administrator in MFA and keeps its test-only TOTP secret under ignored `.test-db/`.
