# BoomoTech V2 Roadmap

## Delivery strategy

Build vertical slices that are usable, testable and deployable. Phase 1 establishes trust and conversions; later phases add operational depth. Do not attempt every feature at once.

## Phase 0 — Decisions and foundations

- Confirm brand assets, domain and business facts
- Approve initial service catalogue and boundaries
- Choose hosting and deployment approach
- Choose content management approach
- Choose booking, commerce/payment, email and form/spam vendors
- Define privacy, retention, support, cancellation, fulfilment and refund rules
- Decide whether the shop belongs in BoomoTech or links to a separate commerce brand
- Define baseline success metrics
- Initialise Next.js, TypeScript, linting, formatting, tests and CI
- Establish tokens, layout primitives and content schemas

Exit: documented decisions, working CI, deployable shell, no unresolved blocker hidden in code.

## Phase 1 — Credible marketing and lead generation

- Responsive global navigation and footer
- Homepage
- Services hub and priority service pages
- Solutions hub and priority audience pages
- About and contact
- Quote request
- Consultation interest/request flow
- Blog/resource foundation and initial approved articles
- FAQ and legal placeholders clearly marked for review
- Technical SEO, sitemap, metadata, structured data
- Privacy-safe analytics
- Accessibility, performance and security review

Suggested priority service pages:

1. IT Support
2. Microsoft 365
3. Network and Wi-Fi
4. Cybersecurity foundations
5. Cloud and infrastructure
6. AI and automation
7. Web and software development

Exit: visitors can understand BoomoTech and submit qualified enquiries; site is production-ready after owner/policy approval.

## Phase 2 — Booking and support operations

- Appointment types and availability
- Booking confirmation, rescheduling and cancellation
- Optional deposit/payment
- Structured support triage
- Safe attachments with file restrictions and malware-scanning plan
- Ticket reference and notifications
- Admin workflow/integration
- Remote-support consent and safety guidance
- Operational dashboards and funnel measurement

Exit: tested end-to-end booking and support intake with documented operational ownership.

## Phase 3 — Curated commerce

- Catalogue, categories, search/filter
- Product detail and compatibility guidance
- Cart and hosted checkout
- Inventory/availability model
- Shipping, tax, returns and refunds
- Order confirmations and admin fulfilment integration
- Product reviews only if verified and moderated
- Commerce analytics without exposing customer data

Exit: real orders can be accepted, fulfilled, refunded and supported under approved policies.

## Phase 4 — Client account and portal

- Authentication and account recovery
- Bookings, orders and support history
- Ticket updates and safe messaging
- Project status/documents if operationally useful
- Role-based access and audit logging
- Data export/deletion process
- Security and privacy review

Do not force account creation for basic browsing. Consider passwordless or federated authentication after threat modelling.

## Phase 5 — Guided recommendations and AI

Start with deterministic guided questions. Add AI only where it materially improves the experience.

Possible capabilities:

- service recommendation assistant;
- support-intake summarisation for staff;
- knowledge-grounded FAQ assistant;
- draft troubleshooting steps with safety limits;
- product compatibility guidance;
- consultation preparation summary.

Requirements:

- human escalation;
- approved knowledge sources and citations;
- privacy boundaries and redaction;
- prompt-injection and abuse protections;
- cost/rate limits;
- evaluation set and fallback behaviour;
- clear disclosure;
- no autonomous device access, purchasing, destructive changes, or security guarantees.

## Backlog candidates

- Service plans/subscriptions
- Customer knowledge base
- Maintenance reminders
- Remote monitoring integrations
- Partner/vendor portal
- Multilingual content, including Persian, only if there is a validated audience and editorial support
- Comparison or diagnostic tools
- Newsletter with explicit consent

## Owner decision register

| Decision | Needed by | Status |
|---|---|---|
| Final positioning/tagline | Phase 1 content | TODO(owner) |
| Priority services and exclusions | Before service copy | TODO(owner) |
| Booking types, duration and prices | Phase 2 | TODO(owner) |
| Onsite area and travel fees | Phase 1/2 | TODO(owner) |
| CMS | Foundation | TODO(owner) |
| Hosting | Foundation | TODO(owner) |
| Commerce/payment provider | Phase 3 | TODO(owner) |
| Booking provider vs custom | Phase 2 | TODO(owner) |
| Shop relationship to AustralianPDS | Before Phase 3 | TODO(owner) |
| Support hours and response language | Phase 1 | TODO(owner) |
| Privacy/retention/policies | Before collecting data | TODO(owner/legal) |
| Client portal necessity | Before Phase 4 | TODO(owner) |

The specific inputs required before contact, consultation, quote, booking or support intake can be connected are recorded in `docs/OPERATIONAL-REQUIREMENTS.md`.

## Quality gates for every phase

- scope and acceptance criteria approved;
- content facts verified;
- security/privacy review proportional to data handled;
- automated checks pass;
- mobile/desktop and accessibility QA;
- error and recovery paths tested;
- operational owner can fulfil what the interface promises;
- documentation and runbook updated.
