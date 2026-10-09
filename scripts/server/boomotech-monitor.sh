#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
LOG_DIR="${BOOMOTECH_MONITOR_LOG_DIR:-/var/log/boomotech-monitor}"
LOCAL_HEALTH_URL="${BOOMOTECH_LOCAL_HEALTH_URL:-http://127.0.0.1:3000/}"
DISK_WARNING_PERCENT="${BOOMOTECH_DISK_WARNING_PERCENT:-80}"
DISK_CRITICAL_PERCENT="${BOOMOTECH_DISK_CRITICAL_PERCENT:-90}"
OUTBOX_WARNING_MINUTES="${BOOMOTECH_OUTBOX_WARNING_MINUTES:-15}"
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
while read -r filesystem _ _ available percent mountpoint; do
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
    section "Notification outbox"
    outbox_summary="$(psql "$DATABASE_URL" --tuples-only --no-align --field-separator='|' --command="SELECT count(*) FILTER (WHERE status = 'pending'), count(*) FILTER (WHERE status IN ('retry', 'processing')), count(*) FILTER (WHERE status = 'failed'), COALESCE(floor(EXTRACT(EPOCH FROM (now() - min(created_at) FILTER (WHERE status IN ('pending', 'retry', 'processing')))) / 60), 0)::bigint FROM notification_outbox;" 2>/dev/null || true)"
    IFS='|' read -r outbox_pending outbox_retrying outbox_failed outbox_oldest_minutes <<<"$outbox_summary"
    if [[ "$outbox_pending" =~ ^[0-9]+$ && "$outbox_retrying" =~ ^[0-9]+$ && "$outbox_failed" =~ ^[0-9]+$ && "$outbox_oldest_minutes" =~ ^[0-9]+$ ]]; then
      log "Notification outbox: pending=$outbox_pending retrying=$outbox_retrying permanently_failed=$outbox_failed oldest_unsent_minutes=$outbox_oldest_minutes."
      (( outbox_oldest_minutes > OUTBOX_WARNING_MINUTES )) && warn "Notification outbox contains items older than ${OUTBOX_WARNING_MINUTES} minutes."
      (( outbox_failed > 0 )) && warn "Notification outbox contains permanently failed items requiring review."
    else
      warn "Notification outbox aggregate health could not be read."
    fi
  else
    critical "PostgreSQL application connection failed."
  fi
else
  critical "Production environment file is not readable: $ENV_FILE"
fi

section "Security posture"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q '^Status: active'; then
  log "UFW is active."
else
  critical "UFW is not active or its status is unavailable."
fi

if systemctl is-active --quiet fail2ban && command -v fail2ban-client >/dev/null 2>&1; then
  if fail2ban-client status sshd >/dev/null 2>&1; then
    log "Fail2ban is active and the sshd jail is available."
  else
    critical "Fail2ban is active but the sshd jail is unavailable."
  fi
else
  critical "Fail2ban is not active."
fi

if systemctl is-active --quiet unattended-upgrades; then
  log "unattended-upgrades is active."
else
  warn "unattended-upgrades is not active."
fi
if [[ -e /var/run/reboot-required ]]; then
  warn "A reboot is required for installed updates."
fi
if command -v apt-get >/dev/null 2>&1; then
  security_update_count="$(apt-get -s -o Debug::NoLocking=true upgrade 2>/dev/null | grep -Ec '^Inst .*(security|Ubuntu[[:space:]]+ESM)' || true)"
  log "Available security-related package updates: ${security_update_count:-0}."
else
  warn "apt-get is unavailable, so security update count was not checked."
fi

if command -v ss >/dev/null 2>&1; then
  listeners="$(ss -H -lntup 2>/dev/null || true)"
  for private_port in 3000 5432; do
    if grep -Eq "(0\\.0\\.0\\.0|\\[::\\]|\\*):${private_port}([[:space:]]|$)" <<<"$listeners"; then
      critical "Private port $private_port is listening on a wildcard interface."
    elif grep -Eq "(127\\.0\\.0\\.1|\\[::1\\]):${private_port}([[:space:]]|$)" <<<"$listeners"; then
      log "Private port $private_port is loopback-only."
    else
      warn "Expected listener on private port $private_port was not detected."
    fi
  done
  public_listener_count="$(awk '{address=$5; if (address ~ /^(0\.0\.0\.0|\[::\]|\*):/ && address !~ /:(22|3000|5432)$/) count++} END {print count+0}' <<<"$listeners")"
  if (( public_listener_count > 0 )); then
    warn "Detected $public_listener_count additional wildcard TCP listener(s); review them with sudo ss -lntup."
  else
    log "No additional wildcard TCP listeners were detected."
  fi
else
  critical "ss is unavailable, so network exposure could not be assessed."
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
