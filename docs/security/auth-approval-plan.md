# Authentication changes awaiting owner approval

Date: 11 October 2026
Status: owner approved and implemented locally on 13 October 2026. Production migration and administrator enrolment remain prohibited until separately approved. See `auth-remediation-2026-10-13.md`.

## Account lockout and backoff (A3)

The owner approved the fixed 15-minute policy in the 13 October 2026 security-fix request. Migration `0005_mushy_bedlam.sql` adds `auth_login_guard`; its primary identifier is an HMAC of the resolved user ID or normalised unknown identifier, never the email or username itself.

Proposed fields:

| Field | Purpose |
|---|---|
| `identifier_hash` (primary key) | HMAC lookup for a resolved user or normalised unknown identifier |
| `failed_attempts` | failures in the active 15-minute window |
| `window_started_at` | start of the active failure window |
| `locked_until` | server-enforced next permitted attempt |
| `updated_at` | retention and operations |

The sign-in hook uses an atomic PostgreSQL upsert so concurrent requests cannot bypass the fifth-attempt threshold. It combines this state with Better Auth's database network limiter and always returns the same generic invalid-credential response while locked. The approved duration is 15 minutes rather than exponential backoff. A completed sign-in resets the state; accounts with MFA reset only after the second factor succeeds. Database failures fail closed.

Proposed retention: remove an unlocked record 30 days after its last failure. Security events should contain an internal user ID when known and a keyed identifier digest otherwise; they must not contain the supplied password or raw login identifier.

Required tests before activation:

1. attempts one to five produce the generic failure and the sixth is blocked even with the correct password;
2. the account becomes usable after the lock period;
3. concurrent attempts cannot exceed the threshold;
4. unknown and real identifiers have the same public response;
5. IP throttling still applies independently;
6. completed authentication clears the state.

## Administrator MFA (A15 / R5)

The owner approved Better Auth 1.7.6 TOTP and one-time recovery codes. Migration `0005_mushy_bedlam.sql` adds the plugin schema and changes administrator sign-in only after the migration is applied.

The activation plan is:

1. apply the additive Better Auth two-factor migration after backup and owner approval;
2. require fresh password re-authentication before enrolment, replacement or removal;
3. display the TOTP secret only during enrolment and confirm one valid code before activation;
4. generate recovery codes with the library, show them once, store only the library's protected representation and require secure offline custody;
5. require MFA for every `admin` role session before granting `/admin` access;
6. revoke or rotate the pre-MFA session after successful second-factor verification;
7. block administrator factor removal and invalidate sessions after enrolment/regeneration;
8. use the protected seed command as the controlled lost-device recovery procedure.

Local tests cover successful TOTP, expired challenge rejection, recovery-code single use, direct endpoint denial, role enforcement and pre-enrolment session invalidation. Production enrolment is not enabled or performed by this branch.

## Session policy (A9)

Current Better Auth sessions have a seven-day expiry and a one-day update age. Server-side database lookup is used on each request and cookie caching is disabled. The policy target is a 30-minute idle timeout and 12-hour absolute timeout. Better Auth's rolling expiry alone does not create a separate immutable absolute lifetime, so meeting both targets may require an additional created-at check or supported session hook.

**OWNER APPROVAL REQUIRED** because shortening the session affects existing users and may invalidate active sessions. Before approval, choose the customer and administrator UX, confirm whether administrator sessions should be shorter, and test expiry across browser restart, password reset and logout-all.

## Account deletion (D11)

There is currently a privacy-request route through the contact/booking workflow, but no self-service deletion control. **OWNER APPROVAL REQUIRED** before adding destructive behaviour.

The proposed flow requires a fresh password check, an explicit confirmation phrase and a server-side transaction. It deletes sessions, credential and verification records, then either deletes or anonymises booking/request records according to the approved legal and operational retention decision. Request messages and audit events need a documented pseudonymisation rule; notification provider records and backups require separate lifecycle handling. The operation must queue a generic confirmation, record a non-personal completion event and test that every old session is rejected.
