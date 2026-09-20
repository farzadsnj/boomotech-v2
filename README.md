# BoomoTech V2

BoomoTech V2 is the planned web platform for BoomoTech: practical IT support, cloud, cybersecurity, AI and automation, web/software services, consultation, service booking, educational content and curated commerce.

This repository contains the product brief and the first application foundation for BoomoTech V2.

The Phase 0 application foundation is under development on a feature branch. It uses Next.js App Router, strict TypeScript, Tailwind CSS, and local structured content. Public enquiry, booking, commerce and account flows are previews only.

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
