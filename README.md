# BoomoTech V2

BoomoTech V2 is the planned web platform for BoomoTech: practical IT support, cloud, cybersecurity, AI and automation, web/software services, consultation, service booking, educational content and curated commerce.

This repository contains the product brief and the Phase 0 / initial Phase 1 application foundation for BoomoTech V2.

The application uses Next.js App Router, strict TypeScript, Tailwind CSS, local typed content, reusable page layouts and progressive accessible motion. Phase 1 informational routes are available for review. Public enquiry, support intake, booking and commerce operations remain unavailable until their privacy and operational requirements are approved.

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

Use Node.js 24 and pnpm 11. Run `pnpm install`, then `pnpm dev`. Copy `.env.example` to `.env.local` if you need to override the local defaults.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before proposing changes. The same checks run in GitHub Actions.

The architecture and outstanding assumptions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Search indexing stays disabled until `SITE_URL` is an approved HTTPS origin and `SITE_INDEXING_ENABLED=true` is set after launch review.

## Chatbot, booking requests and blog

The floating service assistant is implemented in `src/features/chat`. It reads service labels, descriptions and routes from `src/content/services.ts`; `service-matcher.ts` contains only deterministic keyword rules and returns those canonical records. Add or edit a service in the catalogue first, then add matching terms only if visitors use language that the catalogue does not already cover.

The chatbot and `/booking` route render the same progressive `BookingForm`. Both client and server validate requests with the shared Zod schema. The `/api/booking` endpoint applies a request-size limit, a honeypot and a conservative in-memory rate limit, then hands delivery to the isolated Resend adapter. Personal information is not placed in URLs or browser storage and is not logged.

Configure these server-side variables before testing real delivery:

```env
BOOKING_NOTIFICATION_EMAIL=verified-destination@example.com
BOOKING_FROM_EMAIL=BoomoTech <verified-sender@example.com>
RESEND_API_KEY=re_...
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
```

### Remaining production configuration

Before enabling the booking endpoint in production, the owner must confirm the verified recipient and sender domain, privacy and consent wording, retention and deletion rules, expected response language and hours, and the deployment environment. Replace the in-memory limiter with a shared deployment-compatible rate limiter when the site runs across multiple instances. The draft privacy notice and legal terms require owner and legal review. Search indexing remains controlled by `SITE_INDEXING_ENABLED` and an HTTPS `SITE_URL`.
