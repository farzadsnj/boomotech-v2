# BoomoTech security incident response

Date: 11 October 2026
This is an operational response guide, not a legal-compliance statement. Use fake data for rehearsals and preserve real evidence under restricted access.

## First response

1. Record the UTC and Brisbane time, reporter, affected service and a short factual description.
2. Preserve relevant logs and snapshots before cleanup. Do not paste credentials, tokens or personal data into chat, tickets or public issues.
3. Contain the smallest affected boundary. Avoid destroying evidence or restoring over the only useful copy.
4. Assign an incident owner and a separate note taker. Keep decisions and timestamps in a restricted incident record.
5. Decide whether external technical, insurance, legal or customer-notification advice is required. Do not promise a legal outcome before qualified review.

## Scenario playbooks

| Scenario | Immediate containment | Evidence and recovery |
|---|---|---|
| Suspected credential/API-key leak | Revoke/rotate at the provider first; restrict the affected service; never rely on deleting the leaked text | Preserve provider audit/usage logs, identify every location, create a new least-privilege credential, then remove old references. Git history rewrite requires explicit owner approval and coordination |
| Account takeover | Revoke all sessions, reset credentials through the trusted recovery flow, review role/email/MFA changes | Preserve authentication and request events, notify the verified account owner through a trusted channel, restore access only after identity review |
| Database compromise | Isolate application/database network access and revoke the application credential | Preserve database/server logs and a forensic copy where appropriate, identify accessed tables, rebuild from a known-good host and verified backup, rotate dependent credentials |
| Cloudflare/Tunnel compromise | Revoke tunnel/API credentials and remove unauthorised routes/rules from the provider console | Preserve Cloudflare audit events and active configuration, issue new least-privilege credentials, verify tunnel-to-loopback origin before restoring traffic |
| Resend compromise | Revoke the API credential and pause notification workers | Preserve delivery/provider logs without copying message bodies unnecessarily, rotate the key, verify sender/domain settings and review unexpected mail |
| Malicious support request | Quarantine the content; do not follow links, run attachments or copy commands | Preserve the request reference and safe metadata, review related events, block/limit abuse without deleting evidence |
| Server compromise or malware | Use provider console to isolate network access; do not trust binaries on the host | Preserve disk/log evidence, rotate SSH/tunnel/database/provider credentials from a clean device, rebuild rather than in-place clean, restore only validated data |
| Lost SSH private key | Remove the corresponding public key using provider console or a separate trusted administrator session | Review SSH/auth logs, issue a new device-specific key, do not reuse the lost key or expose SSH broadly during recovery |
| Data exposure | Stop the exposed route/storage/config and preserve access evidence | Determine data categories, people, duration and recipients; get legal/privacy advice; decide and document customer/regulator notification |

## Rotation order

Prioritise credentials that can issue or recover others: owner email and password manager, GitHub, hosting/provider console, Cloudflare, SSH, database, authentication secret, Resend and OpenAI. Rotate on a clean device, invalidate sessions after authentication-secret or account recovery changes, and verify the old value no longer works. Never record the values in the incident document.

## Restore and close

Verify backup integrity with the repository restore-test procedure before any production restore. Reapply hardening, migrations, account deletions and credential restrictions to the rebuilt environment. Test local and public health, authentication revocation, notifications, monitoring and backups. Finish with a factual timeline, root cause, affected data, customer-notification decision, controls changed, owner and due date. Rehearse this guide with synthetic data at least annually.
