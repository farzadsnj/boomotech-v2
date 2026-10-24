# BoomoTech V2 architecture and assumptions

## Scope of this foundation

The current application is a production-backed marketing and service-request platform with public service/solution/resource content, local search, a browser-only IT Health Check, PostgreSQL-backed consultation/support requests, verified customer accounts, customer/admin request conversations, persistent in-app notifications and outbound email notifications. Product ordering, payments, confirmed appointments, public file uploads and inbound business mail remain intentionally unavailable until separately reviewed.

## Application shape

- `src/app/` owns App Router pages, metadata files, and the global layout. Pages are Server Components by default.
- `src/components/layout/` holds the site header, footer and a small client wrapper that closes the native `details` mobile menu after navigation. `src/components/ui/`, `src/components/content/` and `src/components/motion/` hold reusable primitives, page layouts and progressive motion.
- `src/content/` holds typed navigation, homepage copy, services, solutions, articles, informational page records and the Zod-validated sample product catalogue. Editorial changes should not require rewriting components.
- `src/db/` contains the Drizzle PostgreSQL schema for users, credential accounts, sessions, verification and database-backed authentication rate limits. `drizzle/` contains reviewable SQL migrations.
- `src/lib/auth/` contains Better Auth configuration, Argon2id password hashing, client integration, schemas, authorization helpers and safe customer projections.
- `src/lib/` also holds URL and metadata helpers. Marketing, article and catalogue data stays local until an approved content management approach exists.
- `src/app/globals.css` defines semantic colour, typography, spacing, focus, and shared shell styles. Page and motion rules are split into `src/styles/pages.css` and `src/styles/motion.css`.
- The root layout loads self-hosted Manrope and Inter variable fonts through `next/font`. Small client components own scroll-aware header state, the long-page scroll-to-top control and fine-pointer hero transforms without making the root layout request-bound.
- Vitest checks content, metadata, product search, authorization, hashing and database-backed authentication. Playwright covers browsers. GitHub Actions applies migrations to PostgreSQL, then runs lint, type-check, tests, a production build and browser checks.

## Security architecture

Authentication uses Better Auth with PostgreSQL-backed sessions and Argon2id password hashes. The merged security controls include a 15–128 Unicode-code-point policy, HIBP k-anonymity range screening, revoke-all-sessions UI, redacted structured security events, security-focused regression tests and client-bundle secret scanning. They do not replace Better Auth or introduce custom session cryptography.

Application authorization remains server-side: customer request access is constrained by the authenticated immutable user ID, administrator mutations require the admin role, write payloads use explicit schemas/allowlists and state-changing custom routes require an approved Origin. Sensitive pages use no-store headers; token-bearing pages additionally use `Referrer-Policy: no-referrer`.

The current security release gate is not yet PASS. Per-identifier failed-login lockout, mandatory administrator TOTP MFA and SEC-017 are merged into `main` with an additive migration. Release remains blocked until the live GitHub code-scanning alert state is confirmed, the migration and administrator enrolment are reviewed, and the owner approves a controlled rollout.

The production network boundary remains Cloudflare Tunnel → loopback Nginx → loopback Next.js → loopback PostgreSQL. Repository documentation treats same-host PostgreSQL TLS, off-site encrypted backup, retention/deletion and external alerting as explicit owner/operations decisions rather than silently claiming compliance.

## Assumptions pending owner decisions

- The homepage copy in `CONTENT.md` is working copy, not approved production copy.
- The supplied logo and its extracted core colours are approved for this milestone. Contact channels, legal text, service boundaries, operational terms and the public domain remain unconfirmed.
- Informational pages are complete enough for review, but all routes remain excluded from indexing until an approved public origin, content, contacts and policies are supplied.
- `SITE_URL` provides the canonical origin when known; local development falls back to `http://localhost:3000`. `SITE_INDEXING_ENABLED` is explicitly set to `true` only after launch review.
- The local route records describe possible services and useful preparation. They are not a claim that every listed service is currently available.
- `/booking` is the single booking-request destination. It stores validated contact and request fields in PostgreSQL and creates a notification outbox record; it does not confirm an appointment.
- `/shop` and `/shop/[slug]` are non-indexed catalogue previews. Current products, prices and availability are explicitly marked samples; there is no cart, checkout or order API.
- `/register`, `/login` and `/dashboard` use database-backed sessions. `/admin/login` and `/admin` use the same authentication system with server-side role checks. Public registration cannot set the `admin` role.

## Next decisions

Confirm priority services and exclusions, contact details, service area and hours, public domain, approved content, booking and response terms, verified product data and suppliers, commerce operations, managed PostgreSQL hosting, backups, account recovery, security monitoring, and privacy/legal text before making new flows public or enabling search indexing. Vendor choices stay open until the relevant flow is scoped.

## Chat, booking and publishing extensions

Published blog records live in `src/content/blog.ts` and generate the blog index, article routes, article metadata, structured data and sitemap paths. The canonical service catalogue in `src/content/services.ts` supplies service names, descriptions and links to the site, chatbot, matcher and booking form.

The floating assistant is a client-side interface over approved local service content. Matching is deterministic and does not send visitor questions to an AI provider. A single progressive booking form is rendered both in the assistant and at `/booking`.

`/api/booking` validates the request origin and body again, limits the decoded payload size, checks a honeypot and calls the `BookingRateLimiter` interface. Development uses a bounded, expiring in-memory fallback. Production uses an atomic PostgreSQL limiter by default and can switch to the REST Redis adapter when multiple application instances require shared external state; its increment and expiry are one Lua operation. Production client identification fails closed unless the approved proxy overwrites forwarded client addresses and `BOOKING_TRUST_PROXY=true`. Valid requests and their notification outbox entries are committed together. Each normal submission carries an opaque idempotency key scoped to the signed-in user or a hashed anonymous client key. A database uniqueness constraint returns the original reference for an identical replay, rejects a changed payload and expires after 24 hours; maintenance clears expired key material without deleting the request. A separately managed oneshot worker validates its configuration before claiming rows, recovers stale claims transactionally, and sends plain-text and escaped HTML through Resend with a timeout and idempotency key. Delivery state is recorded separately, so a notification outage does not discard a booking.

Dashboard notifications use separate request-linked metadata and per-user read receipts. Administrator items are role-scoped but read independently by each MFA-verified administrator; customer items use the immutable owning user ID. Request workflow transactions create the in-app item alongside their audit event and optional email outbox record. Unique source keys prevent duplicates, and the API returns only derived titles, service labels, references and authorised destinations. Email delivery state never acts as dashboard read state.

Dashboard account settings remain inside the existing Better Auth boundary. `/dashboard/settings` requires a verified customer session, while `/admin/settings` requires the administrator role and completed MFA. The custom `/api/account/profile` route has a strict, size-bounded name-only schema, validates the request Origin and derives the target user ID and role from the authenticated session. It cannot change an email address, username, role, verification state or MFA configuration. Password changes continue through Better Auth's current-password endpoint with the existing password policy and session revocation option. Revoke-all-sessions and administrator recovery-code controls remain separate protected operations.

`/dashboard/help` is a protected, server-rendered customer help centre. Its native `details` accordions remain usable without client JavaScript and cover request status, replies, edit locks, safe information sharing and the distinction between a request and a confirmed appointment. Its content lives in `src/features/dashboard/help-content.ts`; it does not expose administrator configuration or request data.

The administrator request activity calendar is a server-rendered projection of request creation timestamps and persisted administrator resolution events. Its repository authorises the MFA-verified administrator before selecting reference, service, status and timestamp fields within a bounded Australia/Brisbane month. URL-backed filters provide month and chronological list views without a client calendar dependency. Calendar entries are operational activity and never represent appointments; scheduling, staff availability, reminders and external calendar integrations remain outside the current data model.

## Shop and account extensions

`src/content/products.ts` is the single catalogue source. Search is deterministic and covers product names, categories, descriptions, keywords, features and specification values. Query and category state stay in the URL. All current product records are marked `placeholder: true` and remain outside the sitemap.

`ProductRow` owns horizontal catalogue behaviour and end-state controls. It uses complete-card tracks on desktop and inline mandatory scroll snapping on mobile; `/shop?view=all` provides the non-carousel full grid. Service, solution and blog records own their local visual assets and alternative text, keeping image choice out of page templates.

Better Auth is mounted at `/api/auth/[...all]` with the Drizzle PostgreSQL adapter, username and admin plugins, origin validation, HTTP-only cookies and database-backed rate limits. Customer email login and administrator username login use the same credential store. Argon2id parameters are defined centrally in `src/lib/auth/password.ts`. Password validation uses Unicode code-point length and an HIBP k-anonymity range lookup; the full password is never transmitted or logged. A breach-service timeout fails open with a redacted security event so an external outage cannot block all account access. Only the administrator seed command can assign the `admin` role. New customer accounts require email verification. The authentication provider signs the expiring token; `email_verification_grant` stores a SHA-256 digest and enforces one-time use through the application `/verify-email` route. Authentication email delivery is isolated from booking notifications.

`src/lib/auth/auth-env.ts` validates `BETTER_AUTH_SECRET` and the Better Auth origin before Better Auth is instantiated. `src/lib/config/environment.ts` rejects a missing production PostgreSQL URL and powers the pre-deployment `pnpm prod:check` command. Production has no authentication-secret, application-origin or database connection fallback.

The initial administrator is created with `pnpm admin:seed` from untracked environment variables. The script creates or updates the administrator and revokes existing sessions. The `/admin` Server Component checks the session role before selecting bounded customer and booking projections. The customer dashboard selects requests only by the authenticated user's immutable ID; guest bookings are never claimed by matching an email address.

The request domain lives in `src/features/requests`. Database transactions enforce edit and withdrawal locks, allowed status transitions, priority changes, private administrator notes, chronological messages and audit events. A monotonic request version prevents stale concurrent updates. Mutation routes validate Zod input, session ownership or admin role, request origin and rate limits. Customer projections never select internal notes. The administrator list uses server-side filters and deterministic ordering: open work, priority, newest date and stable ID.

Password recovery uses Better Auth's database-backed, expiring, single-use reset tokens. Authentication templates and booking notification templates remain separate while sharing one server-only Resend transport. Successful password resets revoke existing sessions.

Production requires PostgreSQL with restricted network access, encrypted backups, restore testing and an approved retention/deletion process. Authentication secrets must come from the deployment secret manager and support rotation. Administrator credential rotation, reviewed worker/timer enablement, external alert delivery and owner-approved retention remain outstanding launch controls.

The application persists HMAC-keyed identifier-level login failures and requires administrator TOTP or a single-use recovery code before privileged access. The schema, transaction boundaries, recovery rules and tests are described in `docs/security/auth-approval-plan.md` and `docs/security/auth-remediation-2026-10-13.md`. Production migration, administrator enrolment and recovery-code custody still require an owner-approved rollout before security release approval.


## Future inbound email boundary

Inbound BoomoTech business mail is not implemented yet. After the security release gate passes, the intended design is Resend inbound email → provider-signed HTTPS webhook → Cloudflare Tunnel → Next.js → PostgreSQL/admin inbox, with replies sent through the Resend outbound API.

This design keeps the Dell behind the existing outbound Cloudflare Tunnel and does not require exposing SMTP/IMAP services or the home public IP. The future webhook must verify the provider signature over the required raw payload, enforce replay/idempotency controls, bound payload and attachment sizes, allow only approved recipient addresses, render untrusted content safely, isolate attachments, avoid automatically fetching email links/content, redact logs and implement an approved retention/deletion policy.
