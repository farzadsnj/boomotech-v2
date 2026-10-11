# BoomoTech project status

Last updated: 11 October 2026

This document is the current operational snapshot of the BoomoTech V2 repository. It complements the detailed architecture, deployment, server-security and feature runbooks. It must be updated whenever a release changes authentication, data handling, infrastructure, public routes, provider integrations or deployment requirements.

## Current production architecture

```text
Visitor
  -> Cloudflare DNS / HTTPS
  -> Cloudflare Tunnel
  -> loopback Nginx
  -> Next.js on 127.0.0.1:3000
  -> PostgreSQL on loopback
```

The production application runs on the Dell Ubuntu host. The intended public entry point is Cloudflare Tunnel; Next.js and PostgreSQL are not intended to be directly reachable from the public internet.

## Current product state

Implemented and in active use or production-ready review:

- responsive public website, services, solutions, resources, support, about and contact content;
- professional navigation with Services and Resources mega menus;
- local public site search containing only approved public content;
- six-question browser-only IT Health Check;
- service-specific preparation questions that keep answers in browser memory and direct visitors to the support request flow;
- PostgreSQL-backed customer registration, verified email, password reset and server-side sessions;
- customer dashboard and authorised request conversation;
- administrator dashboard, request workflow, statuses, priority, internal notes and audit events;
- booking/support request persistence and transactional notification outbox;
- Resend outbound email for account and request notifications;
- Ubuntu/Nginx/Cloudflare Tunnel deployment, monitoring, backup, UFW, Fail2ban and systemd hardening;
- CI checks for application tests, dependency audit, secret scanning and CodeQL.

Deliberately disabled or not yet operational:

- `OPENAI_CHAT_ENABLED=false`;
- `SHOP_ENABLED=false`;
- confirmed appointment scheduling;
- payments/checkout;
- public file uploads;
- inbound business email/web inbox.

## Security-hardening branch

Active branch:

```text
security/application-hardening-2026
```

Pull request:

```text
#27 — security: harden application controls and document release gate
```

The branch adds or strengthens:

- 15–128 Unicode-code-point password policy;
- HIBP Pwned Passwords k-anonymity range checking without sending the full password;
- customer “sign out all devices” control;
- structured redacted security-event logging;
- ownership, role and mass-assignment regression tests;
- token-page `no-store` and `Referrer-Policy: no-referrer`;
- post-build client-bundle secret checking;
- security attack-surface, data-inventory, incident, retention, alerting and backup planning documentation;
- additional application-security CI coverage.

## Current release decision

**SECURITY RELEASE GATE: DO NOT RELEASE**

The security branch must not be merged or deployed yet.

Open release blockers include:

1. persistent per-identifier account lockout/backoff after repeated failed authentication attempts (A3 / SEC-001);
2. mandatory administrator MFA using a maintained Better Auth mechanism (A15/R5 / SEC-002);
3. a new high-severity CodeQL alert reported on PR #27 must be resolved or formally proven to be a false positive before release.

Additional owner decisions remain for session lifetime, account deletion, database TLS policy, retention automation, alert delivery and encrypted off-site backup. These are tracked under `docs/security/`.

No production deployment should occur while the latest security release report says `DO NOT RELEASE` or a required CI/security check is failing.

## Required verification before a future merge

Run locally on the reviewed branch:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:security
pnpm build
pnpm security:client-bundle
pnpm test:e2e
pnpm audit --prod
git diff --check
```

Then require all GitHub checks to be green, including the CodeQL code-scanning result, not only successful execution of the CodeQL workflow job.

## Next planned milestone: secure inbound email

After the security release gate passes, the next separate feature is the BoomoTech inbound business-email system.

Target addresses:

```text
farzad@boomotech.com.au
hello@boomotech.com.au
support@boomotech.com.au
```

Planned architecture:

```text
Internet email
  -> Resend inbound
  -> signed HTTPS webhook
  -> boomotech.com.au through Cloudflare Tunnel
  -> Next.js webhook handler on the Dell
  -> PostgreSQL
  -> admin web inbox

Replies
  -> BoomoTech admin interface
  -> Resend outbound API
  -> recipient
```

The Dell will remain behind Cloudflare Tunnel. The plan does not require a public SMTP/IMAP server on the home connection and does not require exposing the home public IP or opening ports 25, 465, 587 or 993.

The inbound-email implementation must be a separate reviewed change and must include provider signature verification, replay/idempotency protection, bounded payloads, recipient allowlisting, safe HTML/text handling, attachment isolation, redacted logs and an approved retention policy before activation.

## Documentation map

- `README.md` — repository entry point and developer setup.
- `docs/ARCHITECTURE.md` — application boundaries and data-flow architecture.
- `docs/PROFESSIONAL-REDESIGN.md` — current public experience and redesign decisions.
- `docs/SITE-STRUCTURE.md` — public route and user-journey map.
- `docs/DEPLOYMENT.md` — production deployment procedure and release gates.
- `docs/OPERATIONS-HANDBOOK.md` — day-to-day development and production operations.
- `docs/SERVER-SECURITY.md` — Ubuntu, network, service and host hardening.
- `docs/SERVER-BACKUP.md` — backup and restore tooling.
- `docs/SERVER-MONITORING.md` — monitoring and operational logs.
- `docs/NOTIFICATION-OUTBOX.md` — reliable outbound notification worker.
- `docs/AI-CHATBOT.md` — disabled-by-default AI integration.
- `docs/security/` — application security policy, evidence, findings and release reports.
