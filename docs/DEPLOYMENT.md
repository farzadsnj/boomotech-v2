# Production Deployment

`scripts/deploy-production.sh` is an operator-run deployment sequence for the planned single Ubuntu host. It does not connect to or modify a production server by itself.

## Security release gate

Application deployment is allowed only after the reviewed release branch has a passing security gate and all required GitHub checks are green. A successful workflow job is not enough if GitHub code scanning reports a new open alert.

As of 20 October 2026, PR #27 is merged but the application remains **not approved for production**. Persistent account lockout, mandatory administrator TOTP MFA and SEC-017 are present in `main` with additive migration `0005_mushy_bedlam.sql`. The PR workflows passed, but the live CodeQL alert state was not independently available to this local review. Do not deploy or run the migration until the complete release gate is reviewed. See `docs/security/auth-remediation-2026-10-13.md`.

Before every future production deployment, verify at minimum:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:security
pnpm build
pnpm security:client-bundle
pnpm test:e2e
pnpm audit --prod
```

Then verify the pull request has no failing required check, no open Critical/High application-security finding, a reviewed rollback point, and an approved current backup. The operator-run production script remains the deployment mechanism only after these release gates pass.

## Deployment sequence

### CODEX CREATES

The script:

1. refuses root, a dirty working tree or any branch other than `main`;
2. validates the production environment file and approved HTTPS origin;
3. acquires a deployment lock;
4. runs and validates the server backup before fetching code or migrating;
5. fetches and fast-forwards `main` only;
6. runs `pnpm install --frozen-lockfile`;
7. runs `pnpm prod:check` against the complete production environment;
8. runs lint and type-check, then runs unit tests in an isolated test environment with production database, email, OpenAI, proxy and origin variables explicitly removed (unless the operator explicitly uses `--fast`);
9. runs `pnpm db:migrate` and `pnpm build`;
10. restarts `boomotech.service` only after all prior steps pass;
11. checks the local service and public HTTPS origin.

There is no destructive Git reset and no automatic database rollback. Production credentials are never intentionally passed into the unit-test process, preventing tests from contacting the live database, Resend or OpenAI configuration. The production environment is loaded again only after tests pass, before migrations and the production build. A migration failure leaves the running service untouched. A restart or health-check failure prints service diagnostics and stops for manual investigation.

## Server prerequisites

- Ubuntu host with Node.js 22, pnpm 11, Git, curl, PostgreSQL client tools, Nginx and systemd.
- Repository checkout at `/var/www/boomotech`, owned by a dedicated non-root application user.
- A reviewed `boomotech.service` and Nginx/TLS configuration.
- Production PostgreSQL with restricted credentials and tested backups.
- `/var/log/boomotech-deploy` writable by the deployment user.
- Passwordless sudo limited to the reviewed backup script plus `systemctl restart/status` and `journalctl` commands needed by this runbook, rather than unrestricted sudo.

## Production environment

At minimum, the deployment preflight requires:

```env
SITE_URL=https://boomotech.com.au
SITE_INDEXING_ENABLED=false
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://boomotech.com.au
BOOKING_NOTIFICATION_EMAIL=...
BOOKING_FROM_EMAIL=...
RESEND_API_KEY=...
# Optional for future multi-instance rate limiting:
BOOKING_RATE_LIMIT_REST_URL=
BOOKING_RATE_LIMIT_REST_TOKEN=
BOOKING_TRUST_PROXY=true
OPENAI_CHAT_ENABLED=false
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-6-luna
SHOP_ENABLED=false
CUSTOMER_REPLY_TO_EMAIL=
```

Keep the file outside Git, readable only by the application user and approved administrators. The reverse proxy must overwrite forwarded client headers before `BOOKING_TRUST_PROXY=true` is used.

`OPENAI_CHAT_ENABLED` and `SHOP_ENABLED` affect server-rendered navigation, routes, sitemap output and client bundles. Changing either flag requires a reviewed application rebuild and redeployment; editing `.env.production` and restarting the existing build is not sufficient for every UI change. Keep both flags `false` until their separate launch decisions are approved.

`SITE_INDEXING_ENABLED` has the same build and redeployment requirement. Keep it
`false` until public copy, contact details and legal review are approved. The
application accepts public indexing only for the exact `https://boomotech.com.au`
origin. After the reviewed rebuild, purge or revalidate Cloudflare for `/`,
`/robots.txt` and `/sitemap.xml`; then verify the public HTML, response headers,
robots rules and sitemap before Search Console submission.

## Caching and compression boundary

The application sends immutable caching only for versioned `/_next/static/`
assets. It uses short, revalidated caching for robots and sitemap responses and
private `no-store` headers for APIs, authentication, account, administrator and
token pages. Do not create a Cloudflare “Cache Everything” rule that includes
HTML, `/api/*`, `/admin/*`, `/dashboard*` or authentication routes.

The reviewed Nginx example enables gzip for text, CSS, JavaScript, JSON, XML and
SVG responses on the loopback origin hop. Confirm effective compression with
`curl --compressed -I` and use Cloudflare's visitor-facing Brotli setting only
after checking actual response headers. HTTP/2 or HTTP/3 is terminated at
Cloudflare; the existing tunnel-to-Nginx-to-Next.js boundary remains loopback.

Before rollout, compare the active Nginx and Cloudflare configuration with the
repository examples. Ensure neither layer injects a conflicting `X-Robots-Tag`,
rewrites canonical hosts, or publicly caches private responses.

## Dry run and deployment

### COMMANDS YOU MUST RUN ON SERVER

```bash
cd /var/www/boomotech
chmod 0750 scripts/deploy-production.sh scripts/server/*.sh
./scripts/deploy-production.sh --dry-run
./scripts/deploy-production.sh
```

Use `--fast` only during a documented incident or after the exact commit has already passed the skipped checks in trusted CI. Migration and build are never skipped.

## Post-deployment workers and log rotation

Migration `0004` adds notification retry and claim timestamps. Rehearse it against a restored backup before production. After the application deploy succeeds, install the notification timer and logrotate policy as separate reviewed actions:

```bash
cd /var/www/boomotech
sudo ./scripts/server/install-notification-worker.sh
sudo ./scripts/server/install-logrotate.sh
sudo -u boomotechhost -H bash -lc 'set -a; source /var/www/boomotech/.env.production; set +a; pnpm notifications:check'
sudo systemctl start boomotech-notification-worker.service
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
sudo systemctl enable --now boomotech-notification-worker.timer
sudo systemctl status boomotech-notification-worker.timer
sudo logrotate --debug /etc/logrotate.d/boomotech
```

The deployment still uses pnpm 11.19, but the hardened notification systemd service does not invoke pnpm/Corepack at runtime. It executes the project-local `node_modules/.bin/tsx` directly with Node.js 22, avoiding writes to the protected service user's home while `ProtectHome=true` remains enabled. The installer verifies Node.js and that project-local runtime in the service account's restricted environment, installs the units, runs the configuration/database/schema preflight and leaves the timer disabled. It does not process queued notifications by default. After the manual worker run has been inspected, enable the timer explicitly as shown above. `--enable-now` is available only for a separately reviewed automated enablement. Installation is never performed by the deployment script.

Run application maintenance in dry-run mode first and retain the output with the change record:

```bash
sudo -u boomotechhost -H bash -lc 'cd /var/www/boomotech && pnpm maintenance:run'
sudo -u boomotechhost -H bash -lc 'cd /var/www/boomotech && pnpm maintenance:run -- --apply'
```

The apply command removes only expired verification grants, stale rate-limit buckets, old sent outbox rows and long-expired sessions according to documented environment retention values. It does not delete bookings, messages, audit events or failed notifications.

The defaults are `MAINTENANCE_EXPIRED_GRANT_DAYS=30`, `MAINTENANCE_RATE_LIMIT_DAYS=2`, `MAINTENANCE_SENT_OUTBOX_DAYS=90`, `MAINTENANCE_EXPIRED_SESSION_DAYS=30` and `MAINTENANCE_LOGIN_GUARD_DAYS=30`. Login-guard cleanup only removes inactive rows whose locks have expired. `BOOMOTECH_OUTBOX_WARNING_MINUTES=15` controls the aggregate monitor warning. Review these values against the approved privacy and retention policy before using apply mode.

## First deployment review

Before the first live run, confirm:

- the owner approved the domain, environment, legal copy, consent wording, sender and recipient;
- DNS and TLS are active and HSTS remains disabled until HTTPS operation is confirmed;
- database migrations were rehearsed against a recent non-production restore;
- backup and restore-test procedures pass;
- local and external monitoring work;
- secret rotation and incident contacts are documented;
- a maintenance and rollback decision path exists.

## Future GitHub Actions design

A later deployment workflow may build an immutable release, verify it in CI, obtain explicit environment approval and then ask a self-hosted runner or narrowly scoped SSH command to invoke this script. Do not put SSH keys or production environment values in the repository, do not run migrations from an untrusted pull request, and do not enable automatic production deployment until environment approvals and rollback procedures are established.
