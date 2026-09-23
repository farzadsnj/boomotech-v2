# Phase 0 architecture and assumptions

## Scope of this foundation

The current slice is a responsive marketing shell, homepage and complete informational Phase 1 route set. Operational details remain honest unavailable states where service scope, contact details, policies, or owner decisions are pending. No form submission, booking availability, payments, account, support ticket storage, or external service is connected.

## Application shape

- `src/app/` owns App Router pages, metadata files, and the global layout. Pages are Server Components by default.
- `src/components/layout/` holds the site header, footer and a small client wrapper that closes the native `details` mobile menu after navigation. `src/components/ui/`, `src/components/content/` and `src/components/motion/` hold reusable primitives, page layouts and progressive motion.
- `src/content/` holds typed navigation, homepage copy, services, solutions and informational page records. Every inner page declares a `publication` state and an `indexable` flag so editorial readiness is separate from route availability. Editorial changes should not require rewriting components.
- `src/lib/` holds URL and metadata helpers. Data stays local until an approved content management approach exists.
- `src/app/globals.css` defines semantic colour, typography, spacing, focus, and shared shell styles. Page and motion rules are split into `src/styles/pages.css` and `src/styles/motion.css`.
- Vitest checks content, publication and metadata decisions. Playwright checks production HTTP responses, navigation, keyboard access, motion preferences, responsive overflow and security headers in Chromium. GitHub Actions runs lint, type-check, unit tests, a production build and browser tests.

## Production controls

- Unknown catch-all paths are excluded from the generated route set and return an HTTP 404 from the production server.
- Search indexing requires both an approved HTTPS `SITE_URL` and `SITE_INDEXING_ENABLED=true`. The sitemap then includes only records marked `published` and `indexable`; drafts and unavailable flows remain `noindex`.
- Conservative response headers restrict framing, content types, referrer data and unused browser capabilities. HSTS remains disabled until an HTTPS deployment is confirmed.
- Motion is progressive: content is visible without JavaScript, the pre-hydration bootstrap enables reveal styling before body content is parsed, and reduced-motion preferences remove transitions and animation.

## Assumptions pending owner decisions

- The homepage copy in `CONTENT.md` is working copy, not approved production copy.
- The supplied logo and its extracted core colours are approved for this milestone. Contact channels, legal text, service boundaries, operational terms and the public domain remain unconfirmed.
- Published service and solution pages are eligible for indexing after the global launch gate is approved. Draft resources, legal pages and unavailable contact, booking, support and commerce flows remain excluded from the sitemap and carry page-level `noindex` metadata.
- `SITE_URL` provides the canonical origin when known; local development falls back to `http://localhost:3000`. `SITE_INDEXING_ENABLED` is explicitly set to `true` only after launch review.
- The local route records describe possible services and useful preparation. They are not a claim that every listed service is currently available.
- Phase 1 links to quote, consultation, and support routes provide orientation only. They do not collect personal information yet.

## Next decisions

Confirm priority services and exclusions, contact details, service area and hours, public domain, approved content, booking and response terms, product operations, and privacy/legal text before making enquiry flows live or enabling search indexing. The exact enquiry-flow inputs are listed in `docs/OPERATIONAL-REQUIREMENTS.md`. Vendor choices stay open until the relevant flow is scoped.
