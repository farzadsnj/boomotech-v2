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
7. runs lint, type-check and unit tests (unless the operator explicitly uses `--fast`);
8. runs `pnpm db:migrate` and `pnpm build`;
9. restarts `boomotech.service` only after all prior steps pass;
10. checks the local service and public HTTPS origin.

There is no destructive Git reset and no automatic database rollback. A migration failure leaves the running service untouched. A restart or health-check failure prints service diagnostics and stops for manual investigation.

## Server prerequisites

- Ubuntu host with Node.js 24, pnpm 11, Git, curl, PostgreSQL client tools, Nginx and systemd.
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
BOOKING_RATE_LIMIT_REST_URL=...
BOOKING_RATE_LIMIT_REST_TOKEN=...
BOOKING_TRUST_PROXY=true
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-6-luna
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
