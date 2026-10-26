# Owner decisions before public launch

This private repository checklist records business facts that must be approved before they appear publicly. Do not replace these items with placeholder claims.

- Public contact email and telephone number.
- Trading and support hours, holiday coverage and any approved response expectations.
- Onsite service area, travel terms and the boundary between Brisbane onsite work and remote work across Australia.
- Approved prices, GST treatment, minimum charges, deposits, cancellation terms and any quote validity period.
- Confirm the long-term contact-channel policy. The form currently supports email-only requests and requires a phone number only when the visitor asks for phone contact.
- Confirm whether general suburb/region should be collected for requests that may need onsite assessment; the initial form deliberately does not request an exact address.
- Confirm whether business name should remain optional and whether any approved request categories need additional operational questions.
- Final privacy and consent wording, booking-submission retention, deletion handling and the 24-hour idempotency-key retention window.
- Production database TLS policy, application session lifetime and destructive data-retention rules.
- Administrator MFA enrolment, recovery-code custody and tested account-recovery procedure.
- Verified Resend sender/recipient configuration and notification-worker alert destination.
- Applied production migration evidence, encrypted offsite backup evidence and a dated restore test.
- Approved canonical production domain, Cloudflare/Nginx configuration and indexing approval.
- HSTS rollout scope after HTTPS coverage is verified. Do not enable preload or `includeSubDomains` by assumption.
