# Authentication changes awaiting owner approval

Date: 11 October 2026
Status: design only; no schema, migration, session-policy or MFA activation is included in this branch.

## Account lockout and backoff (A3)

**OWNER APPROVAL REQUIRED.** Better Auth currently provides database-backed endpoint rate limits, but it does not implement the policy's per-account lockout state. The proposed design adds a table whose identifier is an HMAC of the normalised login identifier, never the email or username itself.

Proposed fields:

| Field | Purpose |
|---|---|
| `identifier_digest` (unique) | HMAC lookup for the normalised email or username |
| `failure_count` | failures in the active 15-minute window |
| `window_started_at` | start of the active failure window |
| `lock_level` | number of consecutive lock periods for exponential backoff |
| `locked_until` | server-enforced next permitted attempt |
| `last_failed_at` | cleanup and security review |
| `updated_at` | retention and operations |

The sign-in hook would use one transaction and a row lock/upsert so concurrent requests cannot bypass the fifth-attempt threshold. It would combine this state with the existing network rate limit, perform a dummy password verification for unknown identifiers, and always return the same generic sign-in response. A successful sign-in resets the current failure window. Lock duration would progress 15 minutes, 30 minutes, 1 hour, then double to a 24-hour cap. Password reset remains the recovery path. A notification would be queued only for a real account after the transaction, without changing the unauthenticated response.

Proposed retention: remove an unlocked record 30 days after its last failure. Security events should contain an internal user ID when known and a keyed identifier digest otherwise; they must not contain the supplied password or raw login identifier.

Required tests before activation:

1. attempts one to five produce the generic failure and the sixth is blocked even with the correct password;
2. the account becomes usable after the lock period;
3. lock periods increase and cap correctly;
4. concurrent attempts cannot exceed the threshold;
5. unknown and real identifiers have the same public response;
6. IP throttling still applies independently;
7. reset recovery does not disclose the account;
8. cleanup removes only expired lockout state.

## Administrator MFA (A15 / R5)

**OWNER APPROVAL REQUIRED.** Better Auth 1.7 provides a maintained two-factor plugin with TOTP and one-time recovery codes, but enabling it adds schema and changes the administrator sign-in sequence. The recommended first activation is TOTP for the administrator, followed by a separate passkey review.

The activation plan is:

1. add the Better Auth two-factor plugin and generated migration after review;
2. require fresh password re-authentication before enrolment, replacement or removal;
3. display the TOTP secret only during enrolment and confirm one valid code before activation;
4. generate recovery codes with the library, show them once, store only the library's protected representation and require secure offline custody;
5. require MFA for every `admin` role session before granting `/admin` access;
6. revoke or rotate the pre-MFA session after successful second-factor verification;
7. notify the administrator after factor enrolment, replacement, removal and recovery use;
8. document an owner-verified lost-device recovery procedure that cannot be completed by email alone.

Required tests cover successful and failed TOTP, replay rejection, recovery-code single use, role enforcement, factor removal re-authentication, session rotation and lost-device recovery. No MFA endpoint or production enrolment is enabled in this branch.

## Session policy (A9)

Current Better Auth sessions have a seven-day expiry and a one-day update age. Server-side database lookup is used on each request and cookie caching is disabled. The policy target is a 30-minute idle timeout and 12-hour absolute timeout. Better Auth's rolling expiry alone does not create a separate immutable absolute lifetime, so meeting both targets may require an additional created-at check or supported session hook.

**OWNER APPROVAL REQUIRED** because shortening the session affects existing users and may invalidate active sessions. Before approval, choose the customer and administrator UX, confirm whether administrator sessions should be shorter, and test expiry across browser restart, password reset and logout-all.

## Account deletion (D11)

There is currently a privacy-request route through the contact/booking workflow, but no self-service deletion control. **OWNER APPROVAL REQUIRED** before adding destructive behaviour.

The proposed flow requires a fresh password check, an explicit confirmation phrase and a server-side transaction. It deletes sessions, credential and verification records, then either deletes or anonymises booking/request records according to the approved legal and operational retention decision. Request messages and audit events need a documented pseudonymisation rule; notification provider records and backups require separate lifecycle handling. The operation must queue a generic confirmation, record a non-personal completion event and test that every old session is rejected.
