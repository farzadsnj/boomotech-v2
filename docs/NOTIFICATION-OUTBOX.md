# Notification outbox

Booking and request actions write their business record and notification row in the same PostgreSQL transaction. Email delivery happens later through `pnpm notifications:process`; a provider outage cannot roll back or remove the customer request.

## Delivery model

The worker processes `BOOKING_CREATED`, `BOOKING_CUSTOMER_ACK`, `REQUEST_ADMIN_REPLY`, `REQUEST_CUSTOMER_REPLY` and `REQUEST_RESOLVED`. It claims one eligible row inside a transaction with `FOR UPDATE SKIP LOCKED`, changes it to `processing`, increments the attempt count, and commits the claim before contacting Resend. A second worker skips that claim. Stale claims become eligible again after 15 minutes.

Resend receives the unique outbox dedupe key as its idempotency key. This protects the small crash window after provider acceptance and before the row is marked `sent`. A failure records only a generic error class, schedules bounded exponential backoff, and becomes permanently `failed` after five attempts. Customer names, addresses and message bodies are never written to worker logs.

Before claiming new work, the worker recovers claims that have remained `processing` for more than 15 minutes. A stale claim below five attempts becomes retryable and may use its remaining bounded attempt. A stale claim already at five attempts becomes terminally `failed`, clears its processing timestamp and records only `stale-claim-exhausted`. A terminal `BOOKING_CREATED` claim also marks the booking notification state failed. Recovery and selection run inside the same row-locking transaction, and delivery retains the original Resend idempotency key.

Guest administrator responses are emailed to the address saved with the request and contain no dashboard link. Verified account customers receive a dashboard link. Internal notes never enter an email projection. `CUSTOMER_REPLY_TO_EMAIL` is optional; when absent, customer messages omit Reply-To.

## Required configuration

```env
DATABASE_URL=postgresql://...
RESEND_API_KEY=...
BOOKING_NOTIFICATION_EMAIL=...
BOOKING_FROM_EMAIL="BoomoTech <verified-sender@example.com>"
CUSTOMER_REPLY_TO_EMAIL=
SITE_URL=https://boomotech.com.au
```

## Operator commands

Run the preflight without sending email:

```bash
cd /var/www/boomotech
sudo -u boomotechhost -H bash -lc 'set -a; source /var/www/boomotech/.env.production; set +a; pnpm notifications:check'
```

The check validates the required delivery variables, PostgreSQL URL, database connection and required outbox columns. It never sends email or prints the database URL, API key, passwords or customer data. The real worker repeats the delivery-variable validation before it can claim a row, and the systemd service runs the complete preflight as `ExecStartPre`.

Run one batch manually after the unit is installed:

```bash
cd /var/www/boomotech
sudo systemctl start boomotech-notification-worker.service
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
```

The reviewed systemd unit uses `EnvironmentFile=/var/www/boomotech/.env.production` and executes the project-local `node_modules/.bin/tsx` directly. It intentionally does not start through pnpm/Corepack, so `ProtectHome=true` does not require writable pnpm/Corepack state under the service user's home. Do not source the secret environment file into a shared shell history.

After merging and deploying the migration, install the reviewed units. The default installer validates Node.js, the project-local `tsx` runtime and the preflight as `boomotechhost`, then leaves the timer disabled:

```bash
cd /var/www/boomotech
sudo chown boomotechhost:boomotechhost /var/www/boomotech/.env.production
sudo chmod 0600 /var/www/boomotech/.env.production
sudo -u boomotechhost editor /var/www/boomotech/.env.production
sudo ./scripts/server/install-notification-worker.sh
sudo systemctl start boomotech-notification-worker.service
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
sudo systemctl enable --now boomotech-notification-worker.timer
sudo systemctl status boomotech-notification-worker.timer
```

For reviewed automated installation, `sudo ./scripts/server/install-notification-worker.sh --enable-now` may enable and start the timer after the same preflight. The installer never directly starts the worker service. Use `--enable-now` only when the migration, sender, recipient and queued work have already been reviewed.

Review `/var/www/boomotech/.env.production` before installation. Create it from the documented variable list if it does not exist; never overwrite an existing production environment file.

## Monitoring and recovery

The daily host monitor reports timer enabled/active state, the latest systemd worker result, and aggregate pending, retrying, permanently failed and oldest-active values. It never prints notification content or customer details. Investigate failures through generic worker state plus restricted provider logs. Correct the configuration or provider issue, then reset only reviewed failed rows to `retry` with `next_attempt_at=now()`; do not delete the booking.

Rollback the timer without changing request data:

```bash
sudo systemctl disable --now boomotech-notification-worker.timer
sudo rm -f /etc/systemd/system/boomotech-notification-worker.service /etc/systemd/system/boomotech-notification-worker.timer
sudo systemctl daemon-reload
```

Do not roll back migration `0004` while rows or application code depend on its retry columns. Application rollback should retain the additive columns until a separately reviewed data migration is prepared.
