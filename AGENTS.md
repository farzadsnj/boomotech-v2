# AGENTS.md — BoomoTech V2

## Mission

Build BoomoTech V2 as a polished, trustworthy Australian technology platform that helps small businesses and individuals solve practical technology problems and adopt better IT, cloud, cybersecurity, automation, AI, web, and digital solutions.

The website must do more than describe services. It must help visitors:

1. understand what BoomoTech can solve;
2. choose the right service or guided solution;
3. book a consultation or service;
4. submit a structured IT support request;
5. request a quote;
6. buy relevant products;
7. learn through useful articles and guides;
8. return later for support, project updates, or account features.

Primary market: Brisbane and South East Queensland, with remote services available across Australia where suitable.

## Source of truth

Read these documents before making product, content, design, or architecture decisions:

- `docs/BRAND.md`
- `docs/SITE-STRUCTURE.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/CONTENT.md`
- `docs/SEO.md`
- `docs/ROADMAP.md`

If code and documentation disagree, pause and resolve the conflict. Update the relevant document when an approved decision changes.

## Product principles

- Lead with customer problems and outcomes, not a long list of technologies.
- Make the next action obvious on every important page.
- Use progressive disclosure: simple choices first, technical detail when useful.
- Build trust through transparent scope, service process, response expectations, credentials, security, privacy, and real proof.
- Do not invent testimonials, client logos, certifications, partnerships, awards, prices, SLAs, addresses, case-study results, or guarantees.
- Mark unknown business facts with `TODO(owner)`.
- Treat AI as an accelerator with clear human escalation, not as a false promise.
- Keep ecommerce curated and relevant to the service business.
- Design mobile-first, accessible, fast, secure, and SEO-ready.
- Use Australian English and AUD where applicable.

## Initial technical direction

Unless the owner approves a change, use:

- Next.js with App Router
- TypeScript in strict mode
- Tailwind CSS
- Server Components by default; Client Components only when interaction requires them
- A headless content model for services, articles, products, FAQs, and case studies
- PostgreSQL with an ORM when persistent application data is introduced
- A reputable hosted payment provider; never handle raw card details
- Transactional email provider for confirmations and support notifications
- A booking provider or custom availability engine selected only after requirements are confirmed
- Vitest or equivalent for unit/component tests and Playwright for critical end-to-end flows

Keep vendors behind small adapters so CMS, commerce, booking, email, and AI services can be replaced.

## Architecture and coding rules

- Prefer clear feature/domain boundaries over a large generic components folder.
- Keep content/data separate from presentation.
- Validate all server inputs with schemas.
- Authorise every protected server action; never rely on hidden UI alone.
- Keep secrets in environment variables and provide `.env.example` with placeholders only.
- Add rate limiting, spam protection, safe file-upload rules, audit-friendly logging, and error handling to public forms.
- Collect the minimum personal information needed. Define retention and deletion behaviour before storing support data.
- Never send passwords, secrets, or sensitive support attachments to analytics or AI providers.
- Use semantic HTML, keyboard support, visible focus, correct labels, useful alt text, reduced-motion support, and WCAG 2.2 AA as the target.
- Target Core Web Vitals: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at the 75th percentile.
- Avoid unnecessary dependencies, ornamental animation, giant hero sections, generic stock-tech imagery, and inaccessible carousels.
- Prefer subtle CSS motion; lazy-load heavy media.
- Add metadata, canonical URLs, sitemap, robots rules, Open Graph data, and appropriate structured data.
- Do not generate doorway pages or duplicate suburb pages.

## Expected route domains

Public marketing, services and solutions, support intake, consultation/booking, shop, blog/resources, case studies, about, contact, legal policies, and later account/client portal. Exact route map is in `docs/SITE-STRUCTURE.md`.

## Definition of done

A task is not complete until:

- acceptance criteria are met;
- responsive behaviour is checked at mobile, tablet, and desktop sizes;
- accessibility impact is checked;
- loading, empty, success, validation, and error states exist where relevant;
- lint, type-check, and relevant tests pass;
- no secrets or fabricated business claims were added;
- documentation and `.env.example` are updated when needed;
- changed user journeys receive an appropriate manual or automated verification.

## Working method

1. Inspect the repository and relevant documents.
2. State assumptions and identify blocked owner decisions.
3. Implement the smallest coherent vertical slice.
4. Run formatting, lint, type-check, tests, and build.
5. Summarise changed files, decisions, verification, and remaining risks.
6. Do not deploy, purchase services, enable billing, or mutate production data without explicit approval.

Use feature branches and focused commits. Do not rewrite unrelated user changes. Prefer a pull request for substantial milestones.

## Phase-one guardrails

The first release is a credible lead-generation and service-conversion website. Booking, support intake, content, and a product catalogue may be real in Phase 1, but complex marketplace logic, remote-control tooling, autonomous diagnostics, subscriptions, and a full client portal are later phases unless explicitly prioritised.
