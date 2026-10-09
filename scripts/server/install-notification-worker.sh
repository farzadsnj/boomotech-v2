#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
SYSTEMD_DIR="${BOOMOTECH_SYSTEMD_DIR:-/etc/systemd/system}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
SERVICE_USER="${BOOMOTECH_SERVICE_USER:-boomotechhost}"
SERVICE_PATH="/usr/local/bin:/usr/bin:/bin"
ENABLE_NOW=false

case "${1:-}" in
  "") ;;
  --enable-now) ENABLE_NOW=true ;;
  *) printf 'Usage: %s [--enable-now]\n' "$0" >&2; exit 2 ;;
esac

[[ $EUID -eq 0 ]] || { printf 'Run as root.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.service" ]] || { printf 'Worker template is missing.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.timer" ]] || { printf 'Worker timer template is missing.\n' >&2; exit 1; }
id "$SERVICE_USER" >/dev/null 2>&1 || { printf 'Application user %s does not exist.\n' "$SERVICE_USER" >&2; exit 1; }
[[ -r "$ENV_FILE" ]] || { printf 'Production environment file is missing or unreadable.\n' >&2; exit 1; }
command -v runuser >/dev/null 2>&1 || { printf 'runuser is required to validate the service execution environment.\n' >&2; exit 1; }
service_home="$(getent passwd "$SERVICE_USER" | cut -d: -f6)"
[[ -n "$service_home" ]] || { printf 'Could not determine the application user home directory.\n' >&2; exit 1; }

run_as_service_user() {
  runuser --user "$SERVICE_USER" -- env -i HOME="$service_home" USER="$SERVICE_USER" LOGNAME="$SERVICE_USER" PATH="$SERVICE_PATH" "$@"
}

run_as_service_user node --version >/dev/null 2>&1 || { printf 'The %s service account cannot execute Node.js.\n' "$SERVICE_USER" >&2; exit 1; }
run_as_service_user pnpm --version >/dev/null 2>&1 || { printf 'The %s service account cannot execute pnpm.\n' "$SERVICE_USER" >&2; exit 1; }

install -o root -g root -m 0644 "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.service" "$SYSTEMD_DIR/boomotech-notification-worker.service"
install -o root -g root -m 0644 "$PROJECT_DIR/scripts/server/systemd/boomotech-notification-worker.timer" "$SYSTEMD_DIR/boomotech-notification-worker.timer"
systemctl daemon-reload
systemctl disable --now boomotech-notification-worker.timer >/dev/null 2>&1 || true

run_as_service_user bash -c 'set -a; source "$1"; set +a; cd "$2"; exec pnpm notifications:check' bash "$ENV_FILE" "$PROJECT_DIR"

printf 'Installed notification worker service and timer. Configuration preflight passed.\n'
if [[ "$ENABLE_NOW" == true ]]; then
  systemctl enable --now boomotech-notification-worker.timer
  printf 'Notification worker timer enabled and started by explicit --enable-now request.\n'
else
  printf 'Notification worker timer remains disabled. Run one worker manually, inspect the result, then enable the timer explicitly.\n'
fi
printf 'Timer enabled state: %s\n' "$(systemctl is-enabled boomotech-notification-worker.timer 2>/dev/null || true)"
printf 'Timer active state: %s\n' "$(systemctl is-active boomotech-notification-worker.timer 2>/dev/null || true)"
