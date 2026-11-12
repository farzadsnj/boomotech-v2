# Security alerting plan

Status: proposal requiring owner approval. No external alert destination was configured by this review.

## Events

The application emits structured, redacted events for rejected origins, authorization failures, authentication failures, account lockouts, dependency failures and rate-limit decisions. Authentication events contain a random event ID, endpoint, safe category and bounded attempt number; they do not contain the email address, username, identifier hash, password, cookie, token, request body or MFA material. Password-change, password-reset and administrator-factor-change audit events still require a reviewed implementation before launch.

## Proposed thresholds

- Authentication failures are retained as operational warnings; the `authentication_lockout` event is the aggregate escalation point after the approved A3 threshold is reached.
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
