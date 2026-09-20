# Phase 0 architecture and assumptions

## Scope of this foundation

The first slice is a responsive marketing shell and homepage. It provides discoverable routes for the Phase 1 journeys, with honest preview content where service scope, contact details, policies, or operations need owner approval. No form submission, booking availability, payments, account, support ticket storage, or external service is connected.

## Application shape

- `src/app/` owns App Router pages, metadata files, and the global layout. Pages are Server Components by default.
- `src/components/layout/` holds the site header and footer; `src/components/ui/` holds small reusable links, cards, and page sections. The initial mobile menu uses native `details`, so the shell needs no Client Component.
- `src/content/` holds typed navigation, homepage copy, and route records. Editorial changes should not require rewriting components.
- `src/lib/` holds URL and metadata helpers. Data stays local until an approved content management approach exists.
- `src/app/globals.css` defines semantic colour, typography, spacing, focus, and surface tokens. Tailwind utilities consume those tokens.
- Vitest checks content and metadata decisions. GitHub Actions runs lint, type-check, tests, and a production build.

## Assumptions pending owner decisions

- The homepage copy in `CONTENT.md` is working copy, not approved production copy.
- Brand assets, final colours, contact channels, legal text, service boundaries, and public domain are unconfirmed. The interface therefore uses a typographic wordmark, proposed colour tokens, and no invented claims.
- Preview pages are marked as such and excluded from indexing. Indexing remains disabled site-wide until an approved public origin and content are supplied.
- `SITE_URL` provides the canonical origin when known; local development falls back to `http://localhost:3000`. `SITE_INDEXING_ENABLED` is explicitly set to `true` only after launch review.
- The local route records are information architecture, not a claim that every listed service can currently be delivered.
- Phase 1 links to quote, consultation, and support routes provide orientation only. They do not collect personal information yet.

## Next decisions

Confirm priority services and exclusions, brand assets, contact details, service area and hours, public domain, approved content, and privacy/legal text before making enquiry flows live or enabling search indexing. Vendor choices stay open until the relevant flow is scoped.
