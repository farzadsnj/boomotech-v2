# Notification outbox

Booking and request actions write their business record and notification row in the same PostgreSQL transaction. Email delivery happens later through `pnpm notifications:process`; a provider outage cannot roll back or remove the customer request.

## Delivery model

The worker processes `BOOKING_CREATED`, `BOOKING_CUSTOMER_ACK`, `REQUEST_ADMIN_REPLY`, `REQUEST_CUSTOMER_REPLY` and `REQUEST_RESOLVED`. It claims one eligible row inside a transaction with `FOR UPDATE SKIP LOCKED`, changes it to `processing`, increments the attempt count, and commits the claim before contacting Resend. A second worker skips that claim. Stale claims become eligible again after 15 minutes.

Resend receives the unique outbox dedupe key as its idempotency key. This protects the small crash window after provider acceptance and before the row is marked `sent`. A failure records only a generic error class, schedules bounded exponential backoff, and becomes permanently `failed` after five attempts. Customer names, addresses and message bodies are never written to worker logs.

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

Run one batch manually after the unit is installed:

```bash
cd /var/www/boomotech
sudo systemctl start boomotech-notification-worker.service
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
```

The reviewed systemd unit uses `EnvironmentFile=/var/www/boomotech/.env.production`; do not source that secret file into a shared shell history.

After merging and deploying the migration, install the timer deliberately:

```bash
cd /var/www/boomotech
sudo chown boomotechhost:boomotechhost /var/www/boomotech/.env.production
sudo chmod 0600 /var/www/boomotech/.env.production
sudo -u boomotechhost editor /var/www/boomotech/.env.production
sudo ./scripts/server/install-notification-worker.sh
sudo systemctl status boomotech-notification-worker.timer
sudo systemctl start boomotech-notification-worker.service
sudo journalctl -u boomotech-notification-worker.service -n 100 --no-pager
```

Review `/var/www/boomotech/.env.production` before installation. Create it from the documented variable list if it does not exist; never overwrite an existing production environment file.

## Monitoring and recovery

The daily host monitor reports aggregate pending, retrying, permanently failed and oldest-active values. It never prints notification content or customer details. Investigate failures through generic worker state plus restricted provider logs. Correct the configuration or provider issue, then reset only reviewed failed rows to `retry` with `next_attempt_at=now()`; do not delete the booking.

Rollback the timer without changing request data:

```bash
sudo systemctl disable --now boomotech-notification-worker.timer
sudo rm -f /etc/systemd/system/boomotech-notification-worker.service /etc/systemd/system/boomotech-notification-worker.timer
sudo systemctl daemon-reload
```

Do not roll back migration `0004` while rows or application code depend on its retry columns. Application rollback should retain the additive columns until a separately reviewed data migration is prepared.
