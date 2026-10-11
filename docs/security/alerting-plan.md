# Security alerting plan

Status: proposal requiring owner approval. No external alert destination was configured by this review.

## Events

The application emits structured, redacted events for rejected origins, authorization failures and rate-limit decisions. Before launch, approved Better Auth hooks must add failed-login, lockout, password-change, password-reset and administrator-factor-change events without recording credentials, tokens, cookies, request bodies or full personal data.

## Proposed thresholds

- Repeated authentication failures for one client source or identifier: warning; escalate when the approved A3 threshold is reached.
- Repeated authorization failures or origin rejections: warning with a bounded source fingerprint.
- Booking, request, email or AI rate-limit spikes: warning; paid-provider cost threshold: critical.
- Administrator role or MFA changes: immediate critical notification.
- Backup, restore validation, health check or notification worker failure: operational warning, then critical after the owner-approved repeat threshold.

## Owner decisions required

- Alert destination and on-call recipient.
- Retention period and access permissions for security logs.
- Thresholds, quiet hours, escalation path and acknowledgement process.
- Whether provider-side audit logs are exported to a central service.
- Tested incident contact details.

Production alerting must use an authenticated server-side transport, apply least privilege and cost limits, and avoid including personal data in notification bodies.
