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
- [Server backup and restore testing](docs/SERVER-BACKUP.md)
- [Server monitoring](docs/SERVER-MONITORING.md)
- [Production deployment runbook](docs/DEPLOYMENT.md)
- [AI service chatbot](docs/AI-CHATBOT.md)
- [Production server security](docs/SERVER-SECURITY.md)
- [Operations handbook](docs/OPERATIONS-HANDBOOK.md)
- [Notification outbox](docs/NOTIFICATION-OUTBOX.md)

No production claims, prices, policies, testimonials, credentials or case studies should be added unless verified by the owner.

## Run locally

Use Node.js 22 and pnpm 11.19.0. Run `pnpm install`. Copy `.env.example` to `.env.local`, change the public URLs to the local origin, generate a private `BETTER_AUTH_SECRET` of at least 32 random bytes, and follow the database setup below before testing account routes. Marketing, catalogue and blog pages can otherwise run with `pnpm dev`.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before proposing changes. The same checks run in GitHub Actions.

The architecture and outstanding assumptions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Search indexing stays disabled until `SITE_URL` is an approved HTTPS origin and `SITE_INDEXING_ENABLED=true` is set after launch review.

## Interface and content system

The global shell self-hosts the variable Manrope display face and Inter body face through `next/font`; browsers make no runtime Google Fonts request. The header becomes sticky and gains restrained backdrop depth after scrolling. Long pages expose a reduced-motion-aware “Back to top” control. The homepage technical visual uses a small requestAnimationFrame pointer transform on fine pointers only and keeps all text and controls outside the transformed decoration.

Service and solution records own their visual source and alternative text in `src/content/services.ts` and `src/content/solutions.ts`. Add the local SVG under `public/visuals`, then update the record rather than embedding asset choices in a page component. Blog records similarly require `heroImage`, `heroImageAlt` and a visual theme. Local SVGs are displayed with `next/image` at fixed aspect ratios.

The chat welcome appears once per browser session after a short delay. Notification sound is off until the visitor turns it on inside the assistant. The preference is stored locally as `boomotech-chat-sound`; the short Web Audio chime plays at most once per session after a valid interaction and remains independent from reduced-motion settings. Turn it off with the same “Sound on/off” control.

## Shop catalogue

Product records live in `src/content/products.ts` and are validated by Zod when loaded. Add a category to `productCategories`, then add products with unique slugs, local visuals, searchable keywords, features and specifications. `/shop` reads `q` and `category` URL parameters, and `/shop/[slug]` is generated from the same records.

Every current product, price and availability label is sample content for interface review. Checkout, cart, inventory reservation, shipping and payment are intentionally absent. `SHOP_ENABLED=false` hides Shop from global navigation and the sitemap by default; the direct preview remains available and noindex for review. Replace each placeholder record with verified supplier, model, price, stock, warranty, tax and fulfilment information before enabling the flag or indexing the catalogue.

Product collections use an accessible horizontal `ProductRow`: desktop shows complete cards with previous/next controls only when content overflows, while small screens use touch-friendly 86vw scroll-snap tracks. `/shop?view=all` renders the full sample catalogue as a responsive grid. Search and category filters continue to use URL parameters.

## Customer accounts and PostgreSQL

Accounts use Better Auth with the Drizzle PostgreSQL adapter. Passwords are hashed with Argon2id. Sessions are stored in the database and delivered through HTTP-only, SameSite cookies; browser storage is not used. Better Auth validates request origins and stores authentication rate-limit counters in PostgreSQL. Public registration receives the `user` role and cannot supply a role value.

Local database setup:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

The Compose database listens on `localhost:5433`. Development falls back to the Compose-only connection when `DATABASE_URL` is absent; production has no database fallback. For any other PostgreSQL instance, set `DATABASE_URL` and run `pnpm db:migrate`. Never point development migrations or tests at production data.

Required account variables:

```env
DATABASE_URL=postgresql://<user>:<password>@<private-database-host>:5432/boomotech
BETTER_AUTH_SECRET=<at-least-32-random-bytes>
BETTER_AUTH_URL=https://boomotech.com.au
AUTH_FROM_EMAIL=BoomoTech <noreply@send.boomotech.com.au>
RESEND_API_KEY=<server-only-api-key>
EMAIL_VERIFICATION_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=60
```

`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `DATABASE_URL` are validated before their production services are created. Missing values produce actionable configuration errors; production never continues with Better Auth or PostgreSQL defaults. Run `pnpm prod:check` before each production build to verify the approved origin and required server-only mail settings without printing their values.

### Create the initial administrator

Set these values only in untracked `.env.local`:

```env
ADMIN_USERNAME=farzadsnj
ADMIN_EMAIL=<approved-administrator-email>
ADMIN_TEMP_PASSWORD=<strong-temporary-password>
```

Run `pnpm admin:seed`. The command hashes the password, creates or updates the `admin` role, invalidates prior sessions and never prints the password. Remove `ADMIN_TEMP_PASSWORD` immediately afterwards. Re-run the seed with a new strong private password if a temporary or previously shared value was used, then remove it again before `pnpm prod:check`.

After registration, customers are sent to `/check-email`. Better Auth creates a signed expiring token, while BoomoTech stores only its SHA-256 digest in a single-use grant. The public `/verify-email` route consumes that grant before Better Auth marks the email verified. Direct access to Better Auth's verification endpoint is blocked so the one-time check cannot be bypassed. Unverified customers cannot sign in or enter `/dashboard`. Resend requests are rate-limited and use generic responses to reduce account enumeration. Existing accounts present when migration `0002` is applied are marked verified so the migration does not lock out current development users.

`/forgot-password` and `/reset-password` use Better Auth's expiring, single-use reset records and the same isolated authentication-email adapter. Reset responses are generic, delivery is server-only, and a successful reset revokes existing sessions. Invalid, expired and reused links show a safe recovery path.

Administrators sign in with their seeded username at `/admin/login` and are redirected to `/admin`. Both destinations enforce the session and role again on the server. Tests use an isolated capture adapter through `AUTH_EMAIL_CAPTURE_PATH`; never configure that test-only path in production.

Database backups must be encrypted, access controlled, tested for restoration and covered by an owner-approved retention/deletion policy. The database contains customer names, normalized email addresses, password hashes, session data, booking contact details and timestamps. Privacy and legal text still requires owner/legal approval.

## Chatbot, booking requests and blog

The floating service assistant is implemented in `src/features/chat`. It reads service labels, descriptions and routes from `src/content/services.ts`; `service-matcher.ts` contains only deterministic keyword rules and returns those canonical records. Add or edit a service in the catalogue first, then add matching terms only if visitors use language that the catalogue does not already cover.

The chatbot and `/booking` route render the same progressive `BookingForm`. Booking links retain a real `/booking` destination and open the assistant only when JavaScript enhancement is available. Both client and server validate requests with the shared Zod schema. The `/api/booking` endpoint validates the request origin, enforces the decoded request-size limit, checks a honeypot and applies a pluggable rate limiter before storing the request and its notification outbox record in one database transaction. Authentication and booking messages share the server-only Resend transport in `src/lib/email/resend.ts`; feature adapters retain separate recipients, templates and safe error categories. Personal information is not placed in URLs or browser storage and is not logged.

Every saved request receives a public `BT-...` reference. Requests submitted with a verified customer session are linked to that account and appear in its dashboard; guest requests remain unlinked. Customers can edit or withdraw only unread `NEW` requests. Explicit administrator processing locks the original description. Stored messages, statuses, priorities and audit events support an authorised request conversation without matching ownership by email.

Administrators can filter and page requests, explicitly start processing, reply, resolve or reopen within the approved transition map, assign `HIGH`, `MEDIUM` or `LOW` priority, and maintain private internal notes. Internal notes are selected only for the authorised administrator detail view and never enter customer projections or email. Customer replies move `AWAITING_USER` requests back to `IN_PROGRESS`. Customer request lists use protected server pagination and do not expose internal priority.

Notification outbox rows are committed in the same transaction as each booking or message. `pnpm notifications:process` transactionally recovers stale claims, claims pending or retryable rows with PostgreSQL row locking, supplies the unique dedupe key to Resend, applies bounded backoff and marks permanent failure after five attempts. Exhausted stale claims are moved to a terminal state instead of remaining stuck. Booking storage never depends on provider availability. Run `pnpm notifications:check` to validate delivery configuration, database connectivity and the outbox schema without sending email. Install the reviewed two-minute systemd timer only after following [the notification outbox runbook](docs/NOTIFICATION-OUTBOX.md); the installer leaves it disabled unless `--enable-now` is explicitly supplied.

Service questions use the server-only OpenAI Responses API adapter documented in [docs/AI-CHATBOT.md](docs/AI-CHATBOT.md). Public context is built from the canonical service, solution and FAQ records. Requests have origin, size, schema and rate-limit controls; the API key remains server-side and automated tests never call OpenAI. `OPENAI_CHAT_ENABLED=false` is the default: AI choices are hidden, the API fails safely with 503, and deterministic service browsing plus booking remain available. Enabling the flag makes `OPENAI_API_KEY` mandatory. Changes to `OPENAI_CHAT_ENABLED` or `SHOP_ENABLED` require an application rebuild and redeployment because both flags affect server-rendered UI and client bundles.

Configure these server-side variables before testing real delivery:

```env
BOOKING_NOTIFICATION_EMAIL=verified-destination@example.com
BOOKING_FROM_EMAIL=BoomoTech <verified-sender@example.com>
CUSTOMER_REPLY_TO_EMAIL=
OPENAI_CHAT_ENABLED=false
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-6-luna
SHOP_ENABLED=false
RESEND_API_KEY=re_...
# Optional for multi-instance deployments:
BOOKING_RATE_LIMIT_REST_URL=https://your-shared-limiter.example
BOOKING_RATE_LIMIT_REST_TOKEN=...
BOOKING_TRUST_PROXY=true
```

If notification variables are missing or Resend rejects delivery, the database record remains available to the administrator. Retryable rows stay visible to aggregate monitoring and stop after the bounded maximum for operator review. A successful submission remains a request rather than a confirmed appointment.

Host operations also include `pnpm maintenance:run`, which reports eligible expired grants, stale limiter buckets, old sent outbox rows and long-expired sessions without changing data. The `-- --apply` form is deliberate and does not delete bookings, conversations, audit events or failed notifications. Install the reviewed logrotate policy with `sudo ./scripts/server/install-logrotate.sh`; no installer in this repository runs automatically.

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

Before enabling the booking endpoint in production, run `pnpm prod:check` and `pnpm db:migrate` against the intended database, then confirm the verified recipient and sender domain, privacy and consent wording, retention and deletion rules, expected response language, and deployment environment. Production uses PostgreSQL for booking rate limits by default; the optional REST URL and token switch it to a shared external limiter for multi-instance scaling. A trusted Nginx proxy must overwrite client forwarding headers before `BOOKING_TRUST_PROXY=true` is enabled. Account launch additionally requires managed PostgreSQL, encrypted backups, TLS, rotation of every previously used secret, verified password-reset delivery, monitoring and an incident process. The draft privacy notice and legal terms require owner and legal review. Search indexing remains controlled by `SITE_INDEXING_ENABLED` and an approved HTTPS `SITE_URL`.
