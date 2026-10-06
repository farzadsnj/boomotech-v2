# Server Backup and Restore Testing

This runbook covers the operator-run backup tools for a single Ubuntu BoomoTech host. It does not configure off-site storage, encryption keys or production retention policy automatically.

## What the repository provides

### CODEX CREATES

- `scripts/server/backup-boomotech.sh` creates a PostgreSQL custom-format dump and a protected archive of the production environment, systemd, Nginx and Cloudflare Tunnel configuration that exists on the server.
- Every database dump is checked with `pg_restore --list`; every configuration archive is listed with `tar` before it is accepted.
- Daily copies retain the newest 7 files. Sunday copies retain 4 weekly files. Copies made on the first day of a month retain 3 monthly files.
- A lock prevents overlapping backups and partially written files remain hidden until validation passes.
- `scripts/server/restore-boomotech.sh` restores a selected dump only into a generated test database, validates that application tables exist, and removes the test database by default.
- systemd service and timer templates schedule the backup for 02:00 in `Australia/Brisbane`, with a random delay and catch-up after downtime.

The local retention values support operational testing. The owner must approve the final retention period, off-site destination, encryption and deletion policy before launch. A backup stored only on the application server does not protect against loss of that server.

## Prerequisites

- Ubuntu with PostgreSQL client tools matching or newer than the server dump format.
- The production checkout at `/var/www/boomotech` and secrets in `/var/www/boomotech/.env.production`.
- Root-only `/var/backups/boomotech` and `/var/log/boomotech-backup` directories.
- An off-site, access-controlled and encrypted copy process selected by the owner.

## Install and validate

### COMMANDS YOU MUST RUN ON SERVER

```bash
cd /var/www/boomotech
sudo install -m 0750 scripts/server/backup-boomotech.sh /var/www/boomotech/scripts/server/backup-boomotech.sh
sudo install -m 0750 scripts/server/restore-boomotech.sh /var/www/boomotech/scripts/server/restore-boomotech.sh
sudo install -m 0750 scripts/server/install-backup-timer.sh /var/www/boomotech/scripts/server/install-backup-timer.sh
sudo scripts/server/backup-boomotech.sh --dry-run
sudo scripts/server/install-backup-timer.sh
sudo systemctl start boomotech-backup.service
sudo systemctl status boomotech-backup.service --no-pager
sudo systemctl list-timers boomotech-backup.timer
sudo tail -n 100 /var/log/boomotech-backup/backup.log
```

Do not rely on the schedule until the first manual run succeeds and both output files are non-empty.

## Restore test

Choose a validated `.dump` file and run:

### COMMANDS YOU MUST RUN ON SERVER

```bash
latest_dump="$(sudo find /var/backups/boomotech/database/daily -maxdepth 1 -type f -name '*.dump' -printf '%T@ %p\n' | sort -nr | head -n 1 | cut -d' ' -f2-)"
sudo scripts/server/restore-boomotech.sh --dump "$latest_dump"
```

The command creates an isolated database named `boomotech_restore_test_*`, restores the dump, checks that public tables exist, and drops it. Use `--keep-test-database` only for an authorised manual investigation, then remove that database explicitly.

Production restoration is deliberately absent. A production restore requires an owner-approved incident plan, an additional current backup, a maintenance window, confirmation of PostgreSQL versions and an explicit target database review.

## Configuration recovery

Configuration archives contain secrets and must remain root-readable (`0600`). Inspect a copy in a temporary protected directory before restoring individual files. Never extract an archive over `/` without reviewing its member list and comparing each target.

## Checks and alerts

- Review the backup log daily through monitoring or an external alerting system.
- Test restore at least monthly and after PostgreSQL upgrades.
- Copy validated backups off the server and verify that the copy can be read.
- Monitor free space under `/var/backups`.
- Record who can access backups and how deletion requests apply to them.
