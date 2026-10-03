# Phase 0 architecture and assumptions

## Scope of this foundation

The current slice is a responsive marketing shell, complete informational Phase 1 route set, secure consultation request, sample catalogue and first customer account foundation. Operational details remain honest unavailable states where service scope, contact details, policies, or owner decisions are pending. Product ordering, payments, confirmed appointments and support-ticket storage are not connected.

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

`/api/booking` validates the request origin and body again, limits the decoded payload size, checks a honeypot and calls the `BookingRateLimiter` interface. Development uses a bounded, expiring in-memory fallback. Production fails closed unless an Upstash-compatible shared REST limiter and a deployment proxy that overwrites forwarded client addresses are configured. Valid requests and their notification outbox entry are committed together. The notification adapter then sends plain-text and escaped HTML through Resend with a timeout. Delivery state is recorded separately, so a notification outage does not discard a booking.

## Shop and account extensions

`src/content/products.ts` is the single catalogue source. Search is deterministic and covers product names, categories, descriptions, keywords, features and specification values. Query and category state stay in the URL. All current product records are marked `placeholder: true` and remain outside the sitemap.

`ProductRow` owns horizontal catalogue behaviour and end-state controls. It uses complete-card tracks on desktop and inline mandatory scroll snapping on mobile; `/shop?view=all` provides the non-carousel full grid. Service, solution and blog records own their local visual assets and alternative text, keeping image choice out of page templates.

Better Auth is mounted at `/api/auth/[...all]` with the Drizzle PostgreSQL adapter, username and admin plugins, origin validation, HTTP-only cookies and database-backed rate limits. Customer email login and administrator username login use the same credential store. Argon2id parameters are defined centrally in `src/lib/auth/password.ts`. Only the administrator seed command can assign the `admin` role.

`src/lib/auth/auth-env.ts` validates `BETTER_AUTH_SECRET` before Better Auth is instantiated. Every build, start, test and CI environment must provide at least 32 private characters explicitly; there is no production default.

The initial administrator is created with `pnpm admin:seed` from untracked environment variables. The script creates or updates the administrator and revokes existing sessions. The `/admin` Server Component checks the session role before selecting bounded customer and booking projections. The customer dashboard selects bookings only by the authenticated user's immutable ID; guest bookings are never claimed by matching an email address.

Production requires a managed PostgreSQL service with TLS, restricted network access, encrypted backups, restore testing and an approved retention/deletion process. Authentication secrets must come from the deployment secret manager and support rotation. Password recovery, email verification, audit logging and an administrator password-change runbook are outstanding launch controls.
