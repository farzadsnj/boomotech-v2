#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || { printf 'Run as root.\n' >&2; exit 1; }
PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
install -o root -g root -m 0644 "$PROJECT_DIR/scripts/server/logrotate-boomotech" /etc/logrotate.d/boomotech
logrotate --debug /etc/logrotate.d/boomotech
