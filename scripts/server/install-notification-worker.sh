#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
SYSTEMD_DIR="${BOOMOTECH_SYSTEMD_DIR:-/etc/systemd/system}"
[[ $EUID -eq 0 ]] || { printf 'Run as root.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.service" ]] || { printf 'Worker template is missing.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.timer" ]] || { printf 'Worker timer template is missing.\n' >&2; exit 1; }
id boomotechhost >/dev/null 2>&1 || { printf 'Application user boomotechhost does not exist.\n' >&2; exit 1; }
[[ -r "$PROJECT_DIR/.env.production" ]] || { printf 'Production environment file is missing or unreadable.\n' >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { printf 'A system-wide pnpm command is required.\n' >&2; exit 1; }
install -o root -g root -m 0644 "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.service" "$SYSTEMD_DIR/boomotech-notification-worker.service"
install -o root -g root -m 0644 "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.timer" "$SYSTEMD_DIR/boomotech-notification-worker.timer"
systemctl daemon-reload
systemctl enable --now boomotech-notification-worker.timer
systemctl start boomotech-notification-worker.service
systemctl --no-pager --full status boomotech-notification-worker.timer
