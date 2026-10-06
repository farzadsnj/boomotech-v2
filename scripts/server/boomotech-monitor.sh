#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
LOG_DIR="${BOOMOTECH_MONITOR_LOG_DIR:-/var/log/boomotech-monitor}"
LOCAL_HEALTH_URL="${BOOMOTECH_LOCAL_HEALTH_URL:-http://127.0.0.1:3000/}"
DISK_WARNING_PERCENT="${BOOMOTECH_DISK_WARNING_PERCENT:-80}"
DISK_CRITICAL_PERCENT="${BOOMOTECH_DISK_CRITICAL_PERCENT:-90}"
overall_status=0

mkdir -p "$LOG_DIR"
log_file="${LOG_DIR}/$(date -u +%Y-%m-%d).log"
exec >>"$log_file" 2>&1

log() { printf '%s %s\n' "$(date --iso-8601=seconds)" "$*"; }
section() { printf '\n[%s]\n' "$1"; }
warn() { log "WARNING: $*"; }
critical() { log "CRITICAL: $*"; overall_status=2; }

[[ "$DISK_WARNING_PERCENT" =~ ^[0-9]+$ && "$DISK_CRITICAL_PERCENT" =~ ^[0-9]+$ ]] || { log "Invalid disk thresholds."; exit 2; }
(( DISK_WARNING_PERCENT < DISK_CRITICAL_PERCENT && DISK_CRITICAL_PERCENT <= 100 )) || { log "Disk thresholds must be ordered percentages."; exit 2; }

log "Starting daily BoomoTech monitoring snapshot."

section "Network usage"
interface="$(ip route show default 2>/dev/null | awk 'NR==1 {print $5}')"
if command -v vnstat >/dev/null 2>&1 && [[ -n "$interface" ]]; then
  vnstat --iface "$interface" --days 2 || warn "vnStat data is not available for $interface yet."
else
  warn "vnStat or a default network interface is unavailable."
fi

section "CPU and memory"
uptime
printf 'CPU load: '; awk '{print $1, $2, $3}' /proc/loadavg
free -h
ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 8

section "Disk"
mounts=(/)
for path in /var /var/www /var/backups; do [[ -e "$path" ]] && mounts+=("$path"); done
while read -r filesystem blocks used available percent mountpoint; do
  [[ "$percent" == "Use%" ]] && continue
  usage="${percent%%%}"
  log "$mountpoint on $filesystem: $percent used, ${available} KiB available"
  if (( usage >= DISK_CRITICAL_PERCENT )); then critical "Disk usage for $mountpoint is $percent.";
  elif (( usage >= DISK_WARNING_PERCENT )); then warn "Disk usage for $mountpoint is $percent."; fi
done < <(df -Pk "${mounts[@]}" | awk '!seen[$6]++ {print $1, $2, $3, $4, $5, $6}')

section "Application service"
if systemctl is-active --quiet boomotech.service; then
  log "boomotech.service is active."
else
  critical "boomotech.service is not active."
fi
systemctl --no-pager --full status boomotech.service 2>&1 | sed -n '1,12p' || true
if curl --fail --silent --show-error --max-time 10 --output /dev/null "$LOCAL_HEALTH_URL"; then
  log "Local HTTP health check passed: $LOCAL_HEALTH_URL"
else
  critical "Local HTTP health check failed: $LOCAL_HEALTH_URL"
fi

section "PostgreSQL"
if systemctl is-active --quiet postgresql.service; then log "postgresql.service is active."; else warn "postgresql.service is not active or uses a version-specific unit."; fi
if [[ -r "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  if [[ -n "${DATABASE_URL:-}" ]] && psql "$DATABASE_URL" --tuples-only --no-align --command='SELECT 1;' 2>/dev/null | grep -qx '1'; then
    log "PostgreSQL application connection passed."
  else
    critical "PostgreSQL application connection failed."
  fi
else
  critical "Production environment file is not readable: $ENV_FILE"
fi

section "Nginx summary"
access_log="${BOOMOTECH_NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"
error_log="${BOOMOTECH_NGINX_ERROR_LOG:-/var/log/nginx/error.log}"
if [[ -r "$access_log" ]]; then
  log "Recent HTTP status families (last 20000 requests):"
  tail -n 20000 "$access_log" | awk '{status=$9; if (status ~ /^[0-9][0-9][0-9]$/) count[substr(status,1,1)"xx"]++} END {for (key in count) print key, count[key]}' | sort
  log "Most requested paths (query strings removed):"
  tail -n 20000 "$access_log" | awk -F'"' '{split($2, request, " "); split(request[2], path, "?"); if (path[1] != "") print path[1]}' | sort | uniq -c | sort -nr | head -n 15
else
  warn "Nginx access log is not readable: $access_log"
fi
if [[ -r "$error_log" ]]; then
  log "Recent Nginx error lines (last 20):"
  tail -n 20 "$error_log"
else
  warn "Nginx error log is not readable: $error_log"
fi

log "Monitoring snapshot completed with exit status $overall_status."
exit "$overall_status"
