# BoomoTech attack surface

Date: 11 October 2026
Architecture boundary: Cloudflare Tunnel → loopback Nginx → `127.0.0.1:3000` Next.js → loopback PostgreSQL. This repository review did not probe production.

| Route / asset | Method | Authentication / role | Input | Rate limit | State change and CSRF/origin | Data accessed / notes |
|---|---|---|---|---|---|---|
| `/` | GET | Public | None | Infrastructure | No | Local content and feature flags |
| Approved content pages listed below | GET | Public | Path only | Infrastructure | No | Typed local service/solution/information content; unknown catch-all paths return 404 |
| `/blog`, `/blog/[slug]` | GET | Public | Published slug | Infrastructure | No | Typed local published articles and structured data |
| `/tools/it-health-check` | GET/client-only interaction | Public | Local checklist answers | None needed | No server write | Results remain in the browser |
| `/shop`, `/shop/[slug]` | GET | Public preview; flag false removes navigation/sitemap and pages are noindex | Search/category query and approved slug | Client/build-time only | No | Typed sample catalogue; no checkout/payment/inventory write |
| `/booking` | GET | Public | Form fields in browser | Submit endpoint limited | No until submit | Shared request form; page noindex |
| `/api/booking` | POST JSON ≤20 KB | Public; optional verified customer association | Allowlisted name, email, phone, service, message, consent, source and honeypot | 5/10 min via database or reviewed REST adapter; trusted client key required in production | Exact Origin; state-changing | Stores booking and outbox atomically; no appointment confirmation |
| `/api/chat` | POST JSON ≤16 KB | Public only when feature flag enabled | Strict message ≤1,500 and ≤8 bounded history items | 10/10 min, separate namespace | Exact Origin; provider call only | OpenAI key/server knowledge only; feature remains disabled; output is rendered as text |
| `/api/auth/[...all]` | Better Auth GET/POST | Endpoint-specific | Better Auth schemas and tokens | Database-backed rules for signup/sign-in/verification/reset | Better Auth trusted origins and SameSite cookies | Accounts, credentials, sessions, verification and rate limits |
| `/verify-email` | GET | Token holder | Token in query, bounded length | Verification/send rate limit upstream | One-time state change; trusted configured origin creates link; no-referrer/no-store | Consumes hashed custom grant, then Better Auth token |
| `/register`, `/login`, `/admin/login`, `/forgot-password`, `/reset-password`, `/check-email`, `/email-verification-result` | GET plus client POST to auth API | Public | Credential/recovery forms | Auth API limits | Better Auth origin protection; token page no-referrer/no-store | Noindex; password fields never stored in browser storage |
| `/dashboard` | GET | Verified customer | Page number | Infrastructure | No | Server query constrained by session user ID; private no-store |
| `/api/requests/[reference]` | POST JSON ≤12 KB | Verified customer | Edit/withdraw/reply discriminated allowlist | Database-backed per-user mutation limit | Exact Origin | Repository combines reference with session user ID; no internal notes/priority returned |
| `/admin` | GET | `admin` role | Bounded page/filter query; text search currently appears in URL | Infrastructure | No | Bounded customer and request projections; private no-store |
| `/admin/requests/[reference]` | GET | `admin` role | Strict reference | Infrastructure | No | Full operational request, internal notes and events; private no-store |
| `/api/admin/requests/[reference]` | POST JSON ≤12 KB | `admin` role | Strict start/reply/status/priority/notes allowlist | Session/auth limits; no separate route limiter | Exact Origin | Actor ID derived from session; private no-store |
| Local site search | Client-side only | Public | Text query | Bounded local computation | No | Static public index only; excludes customer/admin/request data |
| Static assets / generated Open Graph images | GET | Public | Approved path/slug | CDN/infrastructure | No | Local images/fonts and generated public metadata |
| Notification worker | systemd timer/CLI, no HTTP route | Server operator/service account | Outbox batch/config | Timer and batch cap | State-changing, not browser reachable | Sends escaped text/HTML through Resend; bounded retries and idempotency |
| Maintenance command | CLI only | Server operator | Reviewed retention environment values and `--apply` | Not applicable | Destructive only when explicitly invoked | Deletes only documented expired/stale record classes; not automatically enabled here |
| Backup/restore/monitor/security scripts | Root/operator CLI | Ubuntu operator | Reviewed flags and server environment | Not applicable | Server state only under explicit operator mode | No HTTP user-controlled shell input; live host not modified by this review |
| Cloudflare Tunnel and Nginx origin | Network boundary | Provider/server configuration | HTTPS requests and proxy metadata | Provider/Nginx controls | Proxy boundary | Repository expects no public origin ports and trusted real-IP headers only from loopback tunnel |
| PostgreSQL | Loopback data boundary | Restricted application DB role and local administration | Parameterised ORM/maintenance SQL | Connection limits | Persistent state | Must not be publicly reachable; same-host TLS gap requires owner decision |

Approved typed content paths are: `/about`, `/book`, `/book/consultation`, `/book/onsite-support`, `/book/project-discovery`, `/book/remote-support`, `/contact`, `/cookies`, `/faq`, `/get-a-quote`, `/privacy`, `/resources`, `/services/ai-automation`, `/services/backup-recovery`, `/services/cloud-infrastructure`, `/services/cybersecurity`, `/services/digital-presence`, `/services/it-support`, `/services/managed-it`, `/services/microsoft-365`, `/services/network-wifi`, `/services/ui-ux-branding`, `/services/web-software`, `/solutions/home-office-individuals`, `/solutions/professional-services`, `/solutions/remote-work`, `/solutions/retail`, `/solutions/small-business`, `/support`, `/support/onsite`, `/support/remote`, `/support/safety`, and `/terms`.

## Absent surfaces

There is no payment processing, webhook, public file upload, WebSocket, raw Markdown/HTML authoring, user-supplied URL fetch or direct public database endpoint. H7, H10 and payment-specific D4/D5 are not applicable to the current implementation. The Resend API call uses a fixed provider URL; the optional REST rate-limit URL is server configuration, not visitor input.

## Future inbound email trust boundary

No inbound-email endpoint is implemented in this branch. A future Resend inbound route must verify the Resend/Svix signature over the required raw body, enforce the provider timestamp/replay window, process events idempotently, cap the raw body and attachment sizes, validate a strict schema and approved recipient, isolate attachments, safely convert or sanitise HTML/text, avoid automatically fetching or executing links/content, apply abuse limits, redact logs, and define PII/attachment retention before activation.
