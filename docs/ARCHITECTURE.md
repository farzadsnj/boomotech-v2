# Phase 0 architecture and assumptions

## Scope of this foundation

The current slice is a responsive marketing shell, homepage and complete informational Phase 1 route set. Operational details remain honest unavailable states where service scope, contact details, policies, or owner decisions are pending. No form submission, booking availability, payments, account, support ticket storage, or external service is connected.

## Application shape

- `src/app/` owns App Router pages, metadata files, and the global layout. Pages are Server Components by default.
- `src/components/layout/` holds the site header, footer and a small client wrapper that closes the native `details` mobile menu after navigation. `src/components/ui/`, `src/components/content/` and `src/components/motion/` hold reusable primitives, page layouts and progressive motion.
- `src/content/` holds typed navigation, homepage copy, services, solutions and informational page records. Editorial changes should not require rewriting components.
- `src/lib/` holds URL and metadata helpers. Data stays local until an approved content management approach exists.
- `src/app/globals.css` defines semantic colour, typography, spacing, focus, and shared shell styles. Page and motion rules are split into `src/styles/pages.css` and `src/styles/motion.css`.
- Vitest checks content and metadata decisions. GitHub Actions runs lint, type-check, tests, and a production build.

## Assumptions pending owner decisions

- The homepage copy in `CONTENT.md` is working copy, not approved production copy.
- The supplied logo and its extracted core colours are approved for this milestone. Contact channels, legal text, service boundaries, operational terms and the public domain remain unconfirmed.
- Informational pages are complete enough for review, but all routes remain excluded from indexing until an approved public origin, content, contacts and policies are supplied.
- `SITE_URL` provides the canonical origin when known; local development falls back to `http://localhost:3000`. `SITE_INDEXING_ENABLED` is explicitly set to `true` only after launch review.
- The local route records describe possible services and useful preparation. They are not a claim that every listed service is currently available.
- Phase 1 links to quote, consultation, and support routes provide orientation only. They do not collect personal information yet.

## Next decisions

Confirm priority services and exclusions, contact details, service area and hours, public domain, approved content, booking and response terms, product operations, and privacy/legal text before making enquiry flows live or enabling search indexing. Vendor choices stay open until the relevant flow is scoped.

## Chat, booking and publishing extensions

Published blog records live in `src/content/blog.ts` and generate the blog index, article routes, article metadata, structured data and sitemap paths. The canonical service catalogue in `src/content/services.ts` supplies service names, descriptions and links to the site, chatbot, matcher and booking form.

The floating assistant is a client-side interface over approved local service content. Matching is deterministic and does not send visitor questions to an AI provider. A single progressive booking form is rendered both in the assistant and at `/booking`.

`/api/booking` validates the request again, limits payload size, checks a honeypot and applies a per-instance rate limit. The notification adapter sends through Resend only when all server environment variables are configured. It stores no request database record and never reports success when notification delivery fails. A shared rate-limit store is required for a multi-instance production deployment.
