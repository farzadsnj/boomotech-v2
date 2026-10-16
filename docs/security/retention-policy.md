# Proposed data retention policy

Date: 11 October 2026
Status: **OWNER APPROVAL REQUIRED.** This is a technical proposal. It does not authorise deletion of production data or claim legal compliance.

| Record | Proposed period | Current automation | Decision / implementation needed |
|---|---:|---|---|
| Email-verification and password-reset tokens | Expiry plus no more than 24 hours | Custom email grants are removed after 30 days; generic Better Auth verification rows are not covered by the maintenance script | Approve a migration-free cleanup query and shorten the custom-grant cleanup |
| Expired/revoked sessions | 30 days after expiry at most | `maintenance:run --apply` removes sessions 30 days after expiry | Approve or shorten after session-policy decision |
| Rate-limit buckets | 2 days after last request | Implemented in maintenance script | Approve current default |
| Application auth/security events | 30 days; investigated events up to 90 days | Structured custom-API events use the journal; no automated journal policy in the repository | Approve logrotate/journal retention and alert destination |
| Nginx access/error logs | 30 days unless incident preservation is required | Server logrotate exists for application logs; active Nginx policy must be verified on host | Confirm with privacy and operations owner |
| Sent notification outbox rows | 90 days | Implemented in maintenance script | Approve or reduce |
| Failed notification detail | 90 days after final failure | Not automatically deleted | Add cleanup only after incident/support needs are approved |
| Active booking/support requests and messages | Service relationship plus 24 months after resolution | No deletion automation | Owner/legal decision; define dispute/accounting exceptions |
| Withdrawn guest requests | 90 days | No deletion automation | Owner decision; consider earlier anonymisation |
| Inactive customer accounts | Notify after 18 months; delete/anonymise after 24 months inactivity | No automation or self-service deletion | Owner/legal decision and approved account-deletion design |
| Backups | 7 daily, 4 weekly, 3 monthly | Same-host rotation implemented | Approve encryption, off-site target and deletion propagation |
| Resend provider records | Provider setting and approved business need | External to repository | Confirm provider controls and document actual setting |
| Optional OpenAI chat | No application persistence; provider policy applies | AI disabled by default | Approve provider/privacy/retention before enabling |

## Deletion safeguards

Any production cleanup must support dry-run counts, bounded batches, an operator-visible audit result and a tested backup/restore procedure. Account/request deletion needs referential-integrity and notification-provider handling. Deleted records can persist in backups until backup expiry; after restoration, a deletion ledger or equivalent procedure must reapply deletions. None of those destructive operations is enabled by this security branch.
