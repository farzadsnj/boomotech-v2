#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { printf 'Run this installer with sudo.\n' >&2; exit 1; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v vnstat >/dev/null 2>&1 || { printf 'vnStat is required. Install it before running this installer.\n' >&2; exit 1; }
install -d -m 750 /var/log/boomotech-monitor
install -m 644 "$script_dir/systemd/boomotech-monitor.service" /etc/systemd/system/boomotech-monitor.service
install -m 644 "$script_dir/systemd/boomotech-monitor.timer" /etc/systemd/system/boomotech-monitor.timer
systemctl enable --now vnstat.service
systemctl daemon-reload
systemctl enable --now boomotech-monitor.timer
systemctl --no-pager list-timers boomotech-monitor.timer
printf 'Monitoring timer installed. Run the documented manual check and review its first log.\n'
