# Owner decisions before public launch

This private repository checklist records business facts that must be approved before they appear publicly. Do not replace these items with placeholder claims.

- Public contact email and telephone number.
- Trading and support hours, holiday coverage and any approved response expectations.
- Onsite service area, travel terms and the boundary between Brisbane onsite work and remote work across Australia.
- Approved prices, GST treatment, minimum charges, deposits, cancellation terms and any quote validity period.
- Whether a phone number should remain mandatory on the consultation form. It is currently mandatory on both client and server so requests can be discussed through the supplied channel.
- Final privacy and consent wording, booking-submission retention, deletion handling and the 24-hour idempotency-key retention window.
- Production database TLS policy, application session lifetime and destructive data-retention rules.
- Administrator MFA enrolment, recovery-code custody and tested account-recovery procedure.
- Verified Resend sender/recipient configuration and notification-worker alert destination.
- Applied production migration evidence, encrypted offsite backup evidence and a dated restore test.
- Approved canonical production domain, Cloudflare/Nginx configuration and indexing approval.
- HSTS rollout scope after HTTPS coverage is verified. Do not enable preload or `includeSubDomains` by assumption.
