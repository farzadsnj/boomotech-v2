# BoomoTech V2

BoomoTech V2 is the planned web platform for BoomoTech: practical IT support, cloud, cybersecurity, AI and automation, web/software services, consultation, service booking, educational content and curated commerce.

This repository contains the product brief and the Phase 0 / initial Phase 1 application foundation for BoomoTech V2.

The application uses Next.js App Router, strict TypeScript, Tailwind CSS, local typed content, reusable page layouts and progressive accessible motion. Phase 1 informational routes are available for review. The consultation form can securely email a booking request when its server configuration is complete. A sample product catalogue and PostgreSQL-backed customer account foundation are available for testing. Support tickets, confirmed appointments, product ordering and payments remain unavailable until their operational requirements are approved.

## Start here

1. Read `AGENTS.md`.
2. Review all documents in `docs/`.
3. Resolve the Phase 0 owner decisions in `docs/ROADMAP.md`.
4. Initialise the application through the first coherent milestone.

## Documentation

- [Brand direction](docs/BRAND.md)
- [Site structure](docs/SITE-STRUCTURE.md)
- [Design system](docs/DESIGN-SYSTEM.md)
- [Content strategy](docs/CONTENT.md)
- [SEO strategy](docs/SEO.md)
- [Roadmap](docs/ROADMAP.md)

No production claims, prices, policies, testimonials, credentials or case studies should be added unless verified by the owner.

## Run locally

Use Node.js 24 and pnpm 11. Run `pnpm install`. Copy `.env.example` to `.env.local`, generate a private `BETTER_AUTH_SECRET` of at least 32 random bytes, and follow the database setup below before testing account routes. Marketing, catalogue and blog pages can otherwise run with `pnpm dev`.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before proposing changes. The same checks run in GitHub Actions.

The architecture and outstanding assumptions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Search indexing stays disabled until `SITE_URL` is an approved HTTPS origin and `SITE_INDEXING_ENABLED=true` is set after launch review.

## Interface and content system

The global shell self-hosts the variable Manrope display face and Inter body face through `next/font`; browsers make no runtime Google Fonts request. The header becomes sticky and gains restrained backdrop depth after scrolling. Long pages expose a reduced-motion-aware “Back to top” control. The homepage technical visual uses a small requestAnimationFrame pointer transform on fine pointers only and keeps all text and controls outside the transformed decoration.

Service and solution records own their visual source and alternative text in `src/content/services.ts` and `src/content/solutions.ts`. Add the local SVG under `public/visuals`, then update the record rather than embedding asset choices in a page component. Blog records similarly require `heroImage`, `heroImageAlt` and a visual theme. Local SVGs are displayed with `next/image` at fixed aspect ratios.

The chat welcome appears once per browser session after a short delay. Notification sound is off until the visitor turns it on inside the assistant. The preference is stored locally as `boomotech-chat-sound`; the short Web Audio chime plays at most once per session after a valid interaction and remains independent from reduced-motion settings. Turn it off with the same “Sound on/off” control.

## Shop catalogue

Product records live in `src/content/products.ts` and are validated by Zod when loaded. Add a category to `productCategories`, then add products with unique slugs, local visuals, searchable keywords, features and specifications. `/shop` reads `q` and `category` URL parameters, and `/shop/[slug]` is generated from the same records.

Every current product, price and availability label is sample content for interface review. Checkout, cart, inventory reservation, shipping and payment are intentionally absent. Replace each placeholder record with verified supplier, model, price, stock, warranty, tax and fulfilment information before making the catalogue indexable.

Product collections use an accessible horizontal `ProductRow`: desktop shows complete cards with previous/next controls only when content overflows, while small screens use touch-friendly 86vw scroll-snap tracks. `/shop?view=all` renders the full sample catalogue as a responsive grid. Search and category filters continue to use URL parameters.

## Customer accounts and PostgreSQL

Accounts use Better Auth with the Drizzle PostgreSQL adapter. Passwords are hashed with Argon2id. Sessions are stored in the database and delivered through HTTP-only, SameSite cookies; browser storage is not used. Better Auth validates request origins and stores authentication rate-limit counters in PostgreSQL. Public registration receives the `user` role and cannot supply a role value.

Local database setup:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

The Compose database listens on `localhost:5433`; its local-only credentials match `.env.example`. For a non-Compose PostgreSQL instance, set `DATABASE_URL` and run `pnpm db:migrate`. Never point development migrations or tests at production data.

Required account variables:

```env
DATABASE_URL=postgres://boomotech:boomotech@localhost:5433/boomotech
BETTER_AUTH_SECRET=<at-least-32-random-bytes>
BETTER_AUTH_URL=http://localhost:3000
```

`BETTER_AUTH_SECRET` is validated before the authentication configuration is created. Missing or short values produce one actionable configuration error; production never continues with Better Auth’s default secret. Tests and CI must provide a clearly labelled test-only value explicitly.

### Create the initial administrator

Set these values only in untracked `.env.local`:

```env
ADMIN_USERNAME=farzadsnj
ADMIN_EMAIL=<approved-administrator-email>
ADMIN_TEMP_PASSWORD=<strong-temporary-password>
```

Run `pnpm admin:seed`. The command hashes the password, creates or updates the `admin` role, invalidates prior sessions and never prints the password. Remove `ADMIN_TEMP_PASSWORD` immediately afterwards. Replace the temporary password with a strong private password before any public deployment; a password-change and recovery workflow is still a launch blocker.

Database backups must be encrypted, access controlled, tested for restoration and covered by an owner-approved retention/deletion policy. The database contains customer names, normalized email addresses, password hashes, session data and timestamps. Privacy and legal text still requires owner/legal approval.

## Chatbot, booking requests and blog

The floating service assistant is implemented in `src/features/chat`. It reads service labels, descriptions and routes from `src/content/services.ts`; `service-matcher.ts` contains only deterministic keyword rules and returns those canonical records. Add or edit a service in the catalogue first, then add matching terms only if visitors use language that the catalogue does not already cover.

The chatbot and `/booking` route render the same progressive `BookingForm`. Booking links retain a real `/booking` destination and open the assistant only when JavaScript enhancement is available. Both client and server validate requests with the shared Zod schema. The `/api/booking` endpoint validates the request origin, enforces the decoded request-size limit, checks a honeypot and uses a pluggable rate limiter before handing delivery to the isolated Resend adapter. Personal information is not placed in URLs or browser storage and is not logged.

Configure these server-side variables before testing real delivery:

```env
BOOKING_NOTIFICATION_EMAIL=verified-destination@example.com
BOOKING_FROM_EMAIL=BoomoTech <verified-sender@example.com>
RESEND_API_KEY=re_...
BOOKING_RATE_LIMIT_REST_URL=https://your-shared-limiter.example
BOOKING_RATE_LIMIT_REST_TOKEN=...
BOOKING_TRUST_PROXY=true
```

If any variable is missing or Resend rejects delivery, the interface reports that the request was not delivered. A successful request remains a request rather than a confirmed appointment.

Blog records live in `src/content/blog.ts`. To publish another article, add a unique typed record with `isPublished: true`, complete metadata, structured sections, a related service and related slugs. Published records automatically generate `/blog/[slug]` pages and sitemap entries. Draft records remain outside both.

Run the complete local verification suite after a production build:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

Browser tests prepare an isolated PGlite database under ignored `.test-db/`; application runtime and deployment use PostgreSQL. CI also applies the committed migration to a real PostgreSQL service before running checks.

### Remaining production configuration

Before enabling the booking endpoint in production, the owner must confirm the verified recipient and sender domain, privacy and consent wording, retention and deletion rules, expected response language, and the deployment environment. Production requires the shared booking rate-limit REST URL and token plus a trusted proxy that overwrites client forwarding headers; the bounded booking fallback runs only outside production. Account launch additionally requires managed PostgreSQL, encrypted backups, TLS, secret rotation, password recovery, verified admin email, monitoring and an incident process. The draft privacy notice and legal terms require owner and legal review. Search indexing remains controlled by `SITE_INDEXING_ENABLED` and an approved HTTPS `SITE_URL`.
