# Operational requirements before enquiry flows go live

The current consultation, contact, quote, booking and support pages provide guidance only. Before any page collects or sends personal information, the owner must approve the following details and the implementation must be reviewed against them.

## Contact ownership and delivery

- The verified destination email address or service desk, plus who monitors it and who receives escalations.
- The approved sender name, sender domain and reply-to address for acknowledgements.
- The delivery provider, bounce handling and an auditable way to identify failed notifications.
- Which deployment environment and public domain will host the form, and how secrets will be stored and rotated.

## Collection, privacy and retention

- The minimum fields required for each enquiry type and the documented purpose for collecting each field.
- Approved privacy notice and consent wording shown at submission time. Any marketing consent must be separate and optional.
- Retention period, deletion process, access and correction process, and who is authorised to view submissions.
- Every processor that receives the data, where it is stored, and whether data is handled outside Australia.
- A logging policy that avoids recording message contents, credentials or other sensitive form data.

## Service expectations

- Accurate response wording, including working hours, expected acknowledgement language and how urgent requests are handled.
- Clear boundaries between general enquiries, project discovery and technical support.
- Approved service area, remote and onsite availability, appointment durations, pricing, travel rules and cancellation terms where applicable.
- The confirmation text shown after delivery succeeds and the fallback instructions shown when delivery fails.

## Abuse and safety controls

- Approved spam protection, rate limits and bot controls, with the related privacy impact documented.
- Whether attachments are accepted; if so, permitted formats, size limits, malware scanning and deletion rules.
- Safe wording that tells visitors never to submit passwords, MFA codes, recovery keys, private keys or payment-card information.
- An incident path for misdirected sensitive information, abusive submissions and suspected scams.

These decisions are launch inputs. A real form should not be connected until its destination, handling rules, user wording, security controls and production environment are all confirmed.
