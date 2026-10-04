# Site Structure and User Journeys

## Primary navigation

- Services
- Solutions
- Support
- Shop
- Resources
- About
- Blog
- Book a consultation

Keep the header focused. Put secondary links, account access, policies, and detailed categories in menus or the footer.

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

Healthcare or regulated-industry pages require validated capability and compliance wording before publication.

### Support flow

- `/support` — triage landing page
- `/support/new` — structured support request
- `/support/remote` — what remote support involves and consent requirements
- `/support/onsite` — service area and expectations
- `/support/safety` — scams, credentials, backups and privacy guidance
- `/support/confirmation/[reference]` — request receipt without exposing private data

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
- `/dashboard`
- `/check-email`
- `/email-verification-result`
- `/admin/login`
- `/admin`
- `/admin/requests/[reference]`

New customers verify their email before signing in. The protected customer dashboard shows account-linked requests, descriptions and conversations. The role-protected administrator area lists and filters all requests and provides a deep-linked response workflow. Accounts are not required for browsing or guest booking. Account recovery and broader profile functions remain later work.

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

## Global requirements

Global search is optional for launch; service finder is higher priority. Every important page needs breadcrumbs where useful, a clear CTA, contact alternative, related content, analytics events, and complete empty/error/success states.
