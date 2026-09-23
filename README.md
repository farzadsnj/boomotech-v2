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
- [Operational requirements](docs/OPERATIONAL-REQUIREMENTS.md)

No production claims, prices, policies, testimonials, credentials or case studies should be added unless verified by the owner.

## Run locally

Use Node.js 24 and pnpm 11. Run `pnpm install`, then `pnpm dev`. Copy `.env.example` to `.env.local` if you need to override the local defaults.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` before proposing changes. Install the Chromium test browser once with `pnpm exec playwright install chromium`. The same checks run in GitHub Actions.

The architecture and outstanding assumptions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Search indexing stays disabled until `SITE_URL` is an approved HTTPS origin and `SITE_INDEXING_ENABLED=true` is set after launch review.
