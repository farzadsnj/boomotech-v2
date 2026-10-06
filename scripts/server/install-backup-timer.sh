#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { printf 'Run this installer with sudo.\n' >&2; exit 1; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install -d -m 700 /var/backups/boomotech /var/log/boomotech-backup
install -m 644 "$script_dir/systemd/boomotech-backup.service" /etc/systemd/system/boomotech-backup.service
install -m 644 "$script_dir/systemd/boomotech-backup.timer" /etc/systemd/system/boomotech-backup.timer
systemctl daemon-reload
systemctl enable --now boomotech-backup.timer
systemctl --no-pager list-timers boomotech-backup.timer
printf 'Backup timer installed. Run the documented manual backup and restore test before relying on it.\n'
