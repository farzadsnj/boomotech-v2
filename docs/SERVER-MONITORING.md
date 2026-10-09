# Server Monitoring

The repository provides a low-complexity daily server snapshot for the first Ubuntu deployment. It writes operational data only and must not print the production environment or customer records.

## What the snapshot checks

### CODEX CREATES

`scripts/server/boomotech-monitor.sh` records:

- vnStat daily interface usage;
- load average, highest CPU processes and RAM use;
- unique filesystem use for `/`, `/var`, `/var/www` and `/var/backups` where present;
- warning and critical disk thresholds, defaulting to 80% and 90%;
- `boomotech.service` state and a local HTTP health check;
- notification-worker timer enabled/active state and the latest oneshot service result;
- PostgreSQL service state and an application connection check using `SELECT 1`;
- aggregate notification-outbox pending, retrying, failed and oldest-unsent values without customer fields;
- Nginx HTTP status-family counts, common paths without query strings, and recent error lines.

Daily logs are stored as `/var/log/boomotech-monitor/YYYY-MM-DD.log`. A critical disk, application, database or health-check failure returns a non-zero status so systemd records the failed run.

This snapshot is not an external availability monitor or paging system. Before launch, choose an external monitor and alert destination so a host failure can be detected when the host itself cannot write logs.

## Install

### COMMANDS YOU MUST RUN ON SERVER

```bash
sudo apt-get update
sudo apt-get install -y vnstat postgresql-client curl
cd /var/www/boomotech
sudo install -m 0750 scripts/server/boomotech-monitor.sh /var/www/boomotech/scripts/server/boomotech-monitor.sh
sudo install -m 0750 scripts/server/install-monitoring.sh /var/www/boomotech/scripts/server/install-monitoring.sh
sudo scripts/server/install-monitoring.sh
sudo scripts/server/boomotech-monitor.sh
sudo systemctl status boomotech-monitor.service --no-pager
sudo systemctl list-timers boomotech-monitor.timer
sudo tail -n 200 "/var/log/boomotech-monitor/$(date -u +%Y-%m-%d).log"
```

The timer runs daily at 06:15 in `Australia/Brisbane`, adds up to five minutes of random delay and catches up after downtime.

## Optional environment overrides

Set overrides in the systemd service through a reviewed drop-in rather than editing the committed unit:

```ini
[Service]
Environment=BOOMOTECH_LOCAL_HEALTH_URL=http://127.0.0.1:3000/
Environment=BOOMOTECH_DISK_WARNING_PERCENT=80
Environment=BOOMOTECH_DISK_CRITICAL_PERCENT=90
Environment=BOOMOTECH_OUTBOX_WARNING_MINUTES=15
```

Then run `sudo systemctl daemon-reload` and a manual check. Keep thresholds below 100, with the warning lower than the critical threshold.

## Log handling and privacy

Nginx access logs may contain visitor IP addresses and requested paths. Configure Nginx log rotation, access controls and retention according to the approved privacy policy. Query strings are removed from the common-path summary, but raw Nginx logs remain governed by the server configuration. Do not add request bodies, cookies, authorisation headers, environment values or database rows to this monitor.

## Production decisions still required

- external uptime and certificate monitoring;
- alert destination and escalation ownership;
- log retention and centralisation;
- disk thresholds sized to the production volume;
- expected service health path and response;
- notification-worker failure and permanently failed outbox escalation ownership;
- PostgreSQL service naming if a version-specific unit is used;
- incident response and after-hours expectations.
