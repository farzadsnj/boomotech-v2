# Production Deployment

`scripts/deploy-production.sh` is an operator-run deployment sequence for the planned single Ubuntu host. It does not connect to or modify a production server by itself.

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
SITE_URL=https://approved.example
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://approved.example
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
sudo systemctl start boomotech-notification-worker.service
sudo systemctl status boomotech-notification-worker.timer
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
sudo logrotate --debug /etc/logrotate.d/boomotech
```

The worker needs a system-wide Node.js 22 and pnpm 11.19 installation accessible to `boomotechhost`, plus `/var/www/boomotech/.env.production` owned by that account with mode `0600`. Installation is never performed by the deployment script.

Run application maintenance in dry-run mode first and retain the output with the change record:

```bash
sudo -u boomotechhost -H bash -lc 'cd /var/www/boomotech && pnpm maintenance:run'
sudo -u boomotechhost -H bash -lc 'cd /var/www/boomotech && pnpm maintenance:run -- --apply'
```

The apply command removes only expired verification grants, stale rate-limit buckets, old sent outbox rows and long-expired sessions according to documented environment retention values. It does not delete bookings, messages, audit events or failed notifications.

The defaults are `MAINTENANCE_EXPIRED_GRANT_DAYS=30`, `MAINTENANCE_RATE_LIMIT_DAYS=2`, `MAINTENANCE_SENT_OUTBOX_DAYS=90` and `MAINTENANCE_EXPIRED_SESSION_DAYS=30`. `BOOMOTECH_OUTBOX_WARNING_MINUTES=15` controls the aggregate monitor warning. Review these values against the approved privacy and retention policy before using apply mode.

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
