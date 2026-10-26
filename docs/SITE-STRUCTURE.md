# Site Structure and User Journeys

## Primary navigation

- Services
- Help for individuals
- Help for businesses
- Pricing & quotes
- About
- Get help

Resources, blog posts, FAQs and the IT Health Check remain available through mobile secondary navigation, page links, search and the footer without competing with the primary help journey. Detailed services remain in the Services mega menu. Client portal and request submission are utility actions. Shop stays behind `SHOP_ENABLED=false` until catalogue operations are approved.

## Route map

### Core

- `/` — Homepage
- `/services` — Service finder and overview
- `/solutions` — Outcome/industry-oriented solutions
- `/support` — IT problem-solving entry point
- `/booking` — Primary secure consultation request; a request does not confirm an appointment
- `/book` — Consultation options and preparation guidance linking to `/booking`
- `/shop` — Curated product catalogue
- `/resources` — Blog, guides, FAQs and downloads
- `/learning` — Future learning portal structure; reviewed courses are not active yet
- `/pricing` — Service pricing approach and quote pathways without unapproved fixed rates
- `/tools/it-health-check` — Local deterministic technology self-check
- `/about`
- `/contact`
- `/get-a-quote`

`/resources` currently links practical preparation cards to real support guidance, reviewed articles, service pages, project preparation and the sample catalogue. It does not advertise unfinished downloads. `/about` includes the verified founder background and a direct consultation path.

### Service pages

- `/services/it-support`
- `/services/managed-it`
- `/services/microsoft-365`
- `/services/cloud-infrastructure`
- `/services/network-wifi`
- `/services/cybersecurity`
- `/services/backup-recovery`
- `/services/ai-automation`
- `/services/web-software`
- `/services/digital-presence`
- `/services/ui-ux-branding`

Each page must define audience, problems, outcomes, inclusions, exclusions, process, delivery method, FAQ, related content, and CTA. Only publish services BoomoTech can genuinely deliver.

### Solution pages

- `/solutions/small-business`
- `/solutions/professional-services`
- `/solutions/retail`
- `/solutions/home-office-individuals`
- `/solutions/remote-work`

`/solutions/home-office-individuals` and `/solutions/small-business` are the primary audience entry pages. They show recognisable problems, linked service starting points, an audience-specific explanatory diagram, boundaries, a labelled illustrative example and a request action that carries only the allowlisted audience and request identifiers into `/booking`.

Healthcare or regulated-industry pages require validated capability and compliance wording before publication.

### Support flow

The current structured request form is `/booking`, backed by `POST /api/booking`. Customer follow-up on an existing account-linked request uses `POST /api/requests/[reference]`; administrator actions use `POST /api/admin/requests/[reference]`. There is no public file-upload route.


- `/support` — triage landing page
- `/support/remote` — what remote support involves and consent requirements
- `/support/onsite` — service area and expectations
- `/support/safety` — scams, credentials, backups and privacy guidance

Suggested intake steps:

1. customer type and location;
2. device/system and problem category;
3. urgency and business impact;
4. safe description and optional permitted attachment;
5. preferred contact and availability;
6. consent, privacy acknowledgement, and submission.

Never request a password or secret. Show emergency/safety boundaries and clarify that submission is not an agreed SLA.

### Booking and consultation

- `/book` — choose appointment type
- `/book/consultation`
- `/book/remote-support`
- `/book/onsite-support`
- `/book/project-discovery`
- `/booking` remains the single request form for all consultation types

Appointment types, duration, price/deposit, availability, rescheduling, travel area, and cancellation rules are `TODO(owner)`.

### Commerce

- `/shop`
- `/shop/[slug]` — sample product detail
- `/cart`
- `/checkout`
- `/order/confirmation`
- `/shipping-returns`

Start with a small, service-relevant catalogue: approved networking, accessories, home-office, security, backup, installation kits, support bundles, or digital service packages. Do not mix unrelated AustralianPDS inventory unless the owner explicitly chooses a shared-store strategy.

### Content and proof

- `/blog`
- `/blog/[slug]`
- `/guides/[slug]`
- `/faq`
- `/case-studies`
- `/case-studies/[slug]`

Never invent case studies. An anonymised case study must still be factual and approved.

### Account foundation

- `/register`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/check-email`
- `/email-verification-result`
- `/admin/login`
- `/admin`
- `/admin/requests/[reference]`

New customers verify their email before signing in. Forgot/reset password uses expiring, single-use links and revokes existing sessions after a successful reset. The protected customer dashboard shows account-linked requests, descriptions and conversations. The role-protected administrator area lists and filters all requests, provides a deep-linked response workflow and keeps internal notes private from customers. Accounts are not required for browsing or guest booking. Broader profile functions remain later work.

### Portal — later phase

- `/account/profile`
- `/account/bookings`
- `/account/orders`
- `/portal/support`
- `/portal/projects`
- `/portal/documents`

Use role-based access and strong authentication. Decide whether customers actually need accounts before requiring them for booking or purchase; guest flows are preferred initially.

### Legal and trust

- `/privacy`
- `/terms`
- `/service-terms`
- `/returns-refunds`
- `/shipping`

The current `/shop` preview supports `q`, `category` and `view=all` query parameters. Landing-page product rows remain horizontally scannable on mobile and expose controls on desktop only when more complete cards are outside the viewport.
- `/cancellations`
- `/accessibility`

Policies require owner/legal review before launch.

## Homepage structure

1. Clear promise and primary actions
2. Problem-based entry cards: get IT help, improve my business, build something, buy a product
3. Core service groups
4. How BoomoTech works
5. Who it helps
6. Trust/proof block using verified facts only
7. Featured solutions or case studies
8. Helpful resources
9. Consultation CTA
10. Footer with contact, service area, legal and social links

## Critical journeys

| Visitor goal | Preferred journey | Conversion |
|---|---|---|
| Fix an urgent IT issue | Home → Support triage → Request | Qualified support ticket |
| Explore business improvements | Home/Solutions → Service → Consultation | Booking |
| Scope a project | Service → Quote/discovery | Qualified lead |
| Buy a product | Shop → Product → Checkout | Order |
| Learn and build trust | Search/Blog → Article → Relevant service | Consultation/support |
| Existing customer needs help | Support/Portal → Request/status | Resolved request |

### Shared discovery and request context

Homepage discovery asks at most three optional questions: audience, recognisable problem or goal, and whether the visitor is fixing something or planning an improvement. A result provides one suggested service, a direct request action and no more than two alternatives. Visitors can skip certainty by selecting “Not sure”.

Allowlisted audience, category, service and intent identifiers may be represented in `/booking` query parameters. Customer-entered descriptions, preparation answers and contact details must not appear in URLs or browser storage. These values transfer in transient application memory and are cleared by a full refresh, successful submission or explicit discard.

The booking sequence is: describe the need, provide contact details, review and consent. Phone is optional for email contact and required only when phone contact is selected. Submission creates a request for review, not an appointment.

## Global requirements

Global public-content search is implemented as a local read-only index and excludes account, administrator and customer-request data. Every important page needs breadcrumbs where useful, a clear CTA, contact alternative, related content, analytics events, and complete empty/error/success states.
