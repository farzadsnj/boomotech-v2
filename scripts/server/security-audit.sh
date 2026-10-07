#!/usr/bin/env bash
set -uo pipefail
umask 077

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
APP_USER="${BOOMOTECH_APP_USER:-boomotechhost}"
APP_SERVICE="${BOOMOTECH_APP_SERVICE:-boomotech.service}"
PUBLIC_URL="${BOOMOTECH_PUBLIC_URL:-https://boomotech.com.au}"
SSH_ALLOW_CIDR="${BOOMOTECH_SSH_ALLOW_CIDR:-}"
WARNING_COUNT=0
FAIL_COUNT=0

finding() {
  local level="$1" check="$2" detail="$3"
  printf '%-4s %-34s %s\n' "$level" "$check" "$detail"
  [[ "$level" == "WARN" ]] && WARNING_COUNT=$((WARNING_COUNT + 1))
  [[ "$level" == "FAIL" ]] && FAIL_COUNT=$((FAIL_COUNT + 1))
}
pass() { finding PASS "$1" "$2"; }
warn() { finding WARN "$1" "$2"; }
fail() { finding FAIL "$1" "$2"; }
has() { command -v "$1" >/dev/null 2>&1; }

check_owner_mode() {
  local path="$1" expected_owner="$2" expected_mode="$3" label="$4"
  if [[ ! -e "$path" ]]; then warn "$label" "Not present: $path"; return; fi
  local actual
  actual="$(stat -c '%U:%a' "$path" 2>/dev/null || true)"
  if [[ "$actual" == "${expected_owner}:${expected_mode}" ]]; then pass "$label" "Owner and mode are ${expected_owner}:${expected_mode}."
  else fail "$label" "Expected ${expected_owner}:${expected_mode}; found ${actual:-unreadable}."; fi
}

check_sshd_value() {
  local output="$1" key="$2" expected="$3"
  if grep -Eiq "^${key}[[:space:]]+${expected}$" <<<"$output"; then pass "SSH ${key}" "Effective value is ${expected}."
  else fail "SSH ${key}" "Effective value is not ${expected}."; fi
}

check_root_config_tree() {
  local path="$1" label="$2" bad
  if [[ ! -e "$path" ]]; then warn "$label" "Not present: $path"; return; fi
  bad="$(find "$path" -xdev \( ! -user root -o -perm -0002 \) -print -quit 2>/dev/null || true)"
  if [[ -z "$bad" ]]; then pass "$label" "Root-owned and no world-writable entries were detected."
  else fail "$label" "At least one entry is not root-owned or is world-writable."; fi
}

printf 'BoomoTech production security audit (read-only)\n'
printf 'Generated: %s\n\n' "$(date --iso-8601=seconds)"

if [[ $EUID -eq 0 ]]; then pass "Audit privileges" "Running read-only checks with root visibility."; else warn "Audit privileges" "Run with sudo for complete firewall, SSH, service and file checks."; fi

if has ufw; then
  ufw_verbose="$(ufw status verbose 2>/dev/null || true)"
  ufw_numbered="$(ufw status numbered 2>/dev/null || true)"
  if grep -qi '^Status: active' <<<"$ufw_verbose"; then pass "UFW state" "Firewall is active."; else fail "UFW state" "Firewall is inactive or unreadable."; fi
  if grep -Eqi 'Default:[[:space:]]+deny \(incoming\), allow \(outgoing\)' <<<"$ufw_verbose"; then pass "UFW defaults" "Incoming deny and outgoing allow are effective."; else fail "UFW defaults" "Expected deny incoming and allow outgoing defaults."; fi
  if grep -Eqi '(^|[[:space:]])(3000|5432)(/tcp)?[[:space:]]+ALLOW IN[[:space:]]+Anywhere' <<<"$ufw_numbered"; then fail "UFW private ports" "Port 3000 or 5432 has a public IPv4/IPv6 allow rule."; else pass "UFW private ports" "No public allow rule detected for 3000 or 5432."; fi
  if grep -Eqi '(^|[[:space:]])(80|443)(/tcp)?[[:space:]]+ALLOW IN[[:space:]]+Anywhere' <<<"$ufw_numbered"; then warn "UFW web ports" "Public 80/443 rule found; Cloudflare Tunnel normally makes it unnecessary."; else pass "UFW web ports" "No public 80/443 allow rule detected."; fi
  if grep -Eqi '(^|[[:space:]])(22|OpenSSH)(/tcp)?[[:space:]]+ALLOW IN[[:space:]]+Anywhere' <<<"$ufw_numbered"; then fail "UFW SSH scope" "SSH is allowed from Anywhere; restrict it to the approved management source.";
  elif [[ -n "$SSH_ALLOW_CIDR" ]]; then
    if grep -Fq "$SSH_ALLOW_CIDR" <<<"$ufw_numbered" && grep -Eq '(^|[[:space:]])(22|OpenSSH)(/tcp)?' <<<"$ufw_numbered"; then pass "UFW SSH scope" "An SSH rule for the supplied management CIDR is present."; else fail "UFW SSH scope" "No SSH rule was found for BOOMOTECH_SSH_ALLOW_CIDR."; fi
  else warn "UFW SSH scope" "Set BOOMOTECH_SSH_ALLOW_CIDR to verify the approved management source."; fi
  if [[ -r /etc/default/ufw ]] && grep -Eq '^IPV6=yes' /etc/default/ufw; then pass "UFW IPv6 policy" "IPv6 filtering is enabled."; else warn "UFW IPv6 policy" "IPv6 filtering is disabled or could not be confirmed."; fi
else fail "UFW availability" "ufw is not installed."; fi

if has ss; then
  listeners="$(ss -H -lntup 2>/dev/null || true)"
  for port in 3000 5432; do
    if grep -Eq "(0\\.0\\.0\\.0|\\[::\\]|\\*):${port}([[:space:]]|$)" <<<"$listeners"; then fail "Port ${port} binding" "Service is listening on a wildcard interface.";
    elif grep -Eq "(127\\.0\\.0\\.1|\\[::1\\]):${port}([[:space:]]|$)" <<<"$listeners"; then pass "Port ${port} binding" "Service is loopback-only.";
    else warn "Port ${port} binding" "No listener was detected; confirm whether the service should be running."; fi
  done
  public_other="$(awk '{address=$5; if (address ~ /^(0\.0\.0\.0|\[::\]|\*):/ && address !~ /:(22|3000|5432)$/) print address}' <<<"$listeners" | sort -u | paste -sd, -)"
  if [[ -n "$public_other" ]]; then warn "Other public listeners" "Review wildcard listeners on ports: $(sed -E 's/.*:([0-9]+)$/\1/' <<<"${public_other//,/$'\n'}" | sort -un | paste -sd, -)."; else pass "Other public listeners" "No additional wildcard TCP listeners detected."; fi
else fail "Socket audit" "ss is unavailable."; fi

if has sshd; then
  sshd_effective="$(sshd -T 2>/dev/null || true)"
  if [[ -n "$sshd_effective" ]]; then
    check_sshd_value "$sshd_effective" permitrootlogin no
    check_sshd_value "$sshd_effective" passwordauthentication no
    check_sshd_value "$sshd_effective" kbdinteractiveauthentication no
    check_sshd_value "$sshd_effective" pubkeyauthentication yes
    check_sshd_value "$sshd_effective" permitemptypasswords no
    check_sshd_value "$sshd_effective" x11forwarding no
    if sshd -t >/dev/null 2>&1; then pass "SSH configuration" "sshd -t validation passed."; else fail "SSH configuration" "sshd -t validation failed."; fi
  else fail "SSH effective config" "sshd -T did not return an effective configuration."; fi
else fail "SSH availability" "sshd is unavailable."; fi

app_home="$(getent passwd "$APP_USER" 2>/dev/null | cut -d: -f6)"
if [[ -n "$app_home" ]]; then
  check_owner_mode "$app_home/.ssh" "$APP_USER" 700 "SSH directory permissions"
  check_owner_mode "$app_home/.ssh/authorized_keys" "$APP_USER" 600 "SSH key permissions"
  if [[ -s "$app_home/.ssh/authorized_keys" ]]; then pass "SSH authorised key" "At least one authorised key is present."; else fail "SSH authorised key" "No authorised public key is present."; fi
  if [[ -e "$app_home/.env.admin-bootstrap" ]]; then fail "Admin bootstrap file" "Remove ~/.env.admin-bootstrap after administrator setup."; else pass "Admin bootstrap file" "No leftover bootstrap file was found."; fi
else fail "Application account" "User $APP_USER was not found."; fi

if has fail2ban-client; then
  if systemctl is-active --quiet fail2ban; then pass "Fail2ban service" "Service is active."; else fail "Fail2ban service" "Service is not active."; fi
  if fail2ban-client status sshd >/dev/null 2>&1; then pass "Fail2ban SSH jail" "sshd jail is active."; else fail "Fail2ban SSH jail" "sshd jail is unavailable."; fi
  if fail2ban-client -t >/dev/null 2>&1; then pass "Fail2ban configuration" "Configuration validation passed."; else fail "Fail2ban configuration" "Configuration validation failed."; fi
else warn "Fail2ban availability" "fail2ban-client is not installed."; fi

if systemctl is-enabled --quiet unattended-upgrades 2>/dev/null && systemctl is-active --quiet unattended-upgrades; then pass "Unattended upgrades" "Service is enabled and active."; else fail "Unattended upgrades" "Service is not enabled and active."; fi
for timer in apt-daily.timer apt-daily-upgrade.timer; do
  if systemctl is-enabled --quiet "$timer" 2>/dev/null; then pass "$timer" "Timer is enabled."; else fail "$timer" "Timer is not enabled."; fi
done
if apt-config dump 2>/dev/null | grep -Eq 'Unattended-Upgrade::Automatic-Reboot "false"'; then pass "Automatic reboot" "Automatic reboot is disabled."; else warn "Automatic reboot" "Could not confirm Automatic-Reboot false."; fi
if [[ -e /var/run/reboot-required ]]; then warn "Pending reboot" "A reboot is required for installed updates."; else pass "Pending reboot" "No reboot-required marker is present."; fi

if [[ $EUID -eq 0 ]] && has runuser && has psql; then
  pg_listen="$(runuser -u postgres -- psql -Atqc 'SHOW listen_addresses;' 2>/dev/null || true)"
  pg_port="$(runuser -u postgres -- psql -Atqc 'SHOW port;' 2>/dev/null || true)"
  pg_encryption="$(runuser -u postgres -- psql -Atqc 'SHOW password_encryption;' 2>/dev/null || true)"
  if [[ "$pg_listen" == "localhost" || "$pg_listen" == "127.0.0.1" || "$pg_listen" == "127.0.0.1,::1" || "$pg_listen" == "::1,127.0.0.1" ]]; then pass "PostgreSQL listeners" "listen_addresses is loopback-only."; else fail "PostgreSQL listeners" "listen_addresses is not confirmed loopback-only."; fi
  if [[ "$pg_port" == "5432" ]]; then pass "PostgreSQL port" "PostgreSQL uses the expected local port."; else warn "PostgreSQL port" "PostgreSQL does not report port 5432."; fi
  if [[ "$pg_encryption" == "scram-sha-256" ]]; then pass "PostgreSQL password hashing" "SCRAM-SHA-256 is configured."; else fail "PostgreSQL password hashing" "password_encryption is not scram-sha-256."; fi
  hba_file="$(runuser -u postgres -- psql -Atqc 'SHOW hba_file;' 2>/dev/null || true)"
  if [[ -r "$hba_file" ]]; then
    active_hba="$(sed -E 's/[[:space:]]*#.*$//' "$hba_file" | sed '/^[[:space:]]*$/d')"
    if grep -Eq '(^|[[:space:]])(0\.0\.0\.0/0|::/0)([[:space:]]|$)' <<<"$active_hba"; then fail "PostgreSQL HBA networks" "An unrestricted network rule is active."; else pass "PostgreSQL HBA networks" "No unrestricted network rule was detected."; fi
    if grep -Eq '(^|[[:space:]])trust([[:space:]]|$)' <<<"$active_hba"; then fail "PostgreSQL HBA auth" "An active trust authentication rule was detected."; else pass "PostgreSQL HBA auth" "No active trust rule was detected."; fi
  else fail "PostgreSQL HBA file" "The active pg_hba.conf could not be read."; fi
else warn "PostgreSQL audit" "Run as root with local PostgreSQL client tools for full checks."; fi

check_owner_mode "$PROJECT_DIR/.env.production" "$APP_USER" 600 "Production environment"
unexpected_readable_secret="$(find "$PROJECT_DIR" -xdev -maxdepth 2 -type f \( -name '.env' -o -name '.env.local' -o -name '.env.production' -o -name '.env.admin-bootstrap' \) -perm /0044 -print -quit 2>/dev/null || true)"
if [[ -z "$unexpected_readable_secret" ]]; then pass "Secret file readability" "No discovered environment/bootstrap file is group/world-readable."; else fail "Secret file readability" "At least one environment/bootstrap file is group/world-readable."; fi
if [[ -d /var/backups/boomotech ]]; then
  backup_mode="$(stat -c '%U:%a' /var/backups/boomotech 2>/dev/null || true)"
  if [[ "$backup_mode" =~ ^root:7[05]0$|^root:700$ ]]; then pass "Backup directory" "Root-controlled and not world-readable."; else fail "Backup directory" "Expected a root-controlled 0700/0750 directory."; fi
  insecure_backup="$(find /var/backups/boomotech -xdev -type f \( -perm -0044 -o -perm -0022 \) -print -quit 2>/dev/null || true)"
  if [[ -z "$insecure_backup" ]]; then pass "Backup file modes" "No group/world-readable or writable backup file was found."; else fail "Backup file modes" "At least one backup file has unsafe permissions."; fi
else warn "Backup directory" "/var/backups/boomotech is absent."; fi
for log_spec in "/var/log/boomotech-backup:root" "/var/log/boomotech-monitor:root" "/var/log/boomotech-deploy:${APP_USER}"; do
  directory="${log_spec%:*}"
  expected_owner="${log_spec##*:}"
  if [[ ! -d "$directory" ]]; then warn "Log directory $(basename "$directory")" "Directory is missing."; continue; fi
  log_stat="$(stat -c '%U:%a' "$directory" 2>/dev/null || true)"
  insecure_log="$(find "$directory" -xdev -type f \( -perm -0004 -o -perm -0002 \) -print -quit 2>/dev/null || true)"
  if [[ "$log_stat" == "${expected_owner}:750" || "$log_stat" == "${expected_owner}:700" ]] && [[ -z "$insecure_log" ]]; then pass "Log directory $(basename "$directory")" "Owner and access are restricted."; else fail "Log directory $(basename "$directory")" "Expected owner $expected_owner, mode 0700/0750 and no world-readable/writable log files."; fi
done
world_writable="$(find "$PROJECT_DIR" -xdev -path "$PROJECT_DIR/.git" -prune -o -type f -perm -0002 -print -quit 2>/dev/null || true)"
if [[ -z "$world_writable" ]]; then pass "Application file modes" "No world-writable application file was found."; else fail "Application file modes" "At least one world-writable application file exists."; fi
project_owner="$(stat -c '%U' "$PROJECT_DIR" 2>/dev/null || true)"
if [[ "$project_owner" == "$APP_USER" ]]; then pass "Application checkout owner" "Checkout remains owned by $APP_USER."; else warn "Application checkout owner" "Checkout root is not owned by $APP_USER; review deploy access without recursively changing system files."; fi
if [[ -d "$PROJECT_DIR/.git" ]]; then
  for private_file in .env.production .env.local .env.admin-bootstrap; do
    if git -C "$PROJECT_DIR" check-ignore -q "$private_file"; then pass "Git ignore ${private_file}" "Private file is ignored."; else fail "Git ignore ${private_file}" "Private file is not ignored."; fi
  done
  secret_files="$(git -C "$PROJECT_DIR" grep -IlE '(sk-[A-Za-z0-9_-]{20,}|re_[A-Za-z0-9]{20,}|BEGIN (OPENSSH |RSA |EC )?PRIVATE KEY|postgres(ql)?://[^[:space:]/:]+:[^@[:space:]]+@)' -- . ':(exclude).env.example' ':(exclude)docs/**' ':(exclude)**/*.test.ts' 2>/dev/null || true)"
  if [[ -z "$secret_files" ]]; then pass "Tracked secret patterns" "No high-confidence secret pattern was found."; else fail "Tracked secret patterns" "Potential secret material exists in tracked file(s): $(tr '\n' ',' <<<"$secret_files" | sed 's/,$//')."; fi
  if has gitleaks; then
    if gitleaks detect --source "$PROJECT_DIR" --no-banner --redact --exit-code 1 >/dev/null 2>&1; then pass "Gitleaks" "Redacted repository scan passed."; else fail "Gitleaks" "Potential secret material was reported; run the documented redacted review."; fi
  else warn "Gitleaks" "Optional scanner is not installed; CI should run the pinned scanner."; fi
else warn "Repository audit" "Git checkout was not found at $PROJECT_DIR."; fi

if systemctl is-active --quiet "$APP_SERVICE"; then pass "Application service" "$APP_SERVICE is active."; else fail "Application service" "$APP_SERVICE is not active."; fi
service_user="$(systemctl show "$APP_SERVICE" --property=User --value 2>/dev/null || true)"
if [[ "$service_user" == "$APP_USER" ]]; then pass "Application service user" "Service runs as $APP_USER."; else fail "Application service user" "Service is not confirmed to run as $APP_USER."; fi
unit_text="$(systemctl cat "$APP_SERVICE" 2>/dev/null || true)"
if grep -Eq '^[[:space:]]*Environment(File)?=.*(SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL)=' <<<"$unit_text"; then fail "Systemd secret handling" "A secret-like value appears embedded in the unit.";
elif grep -Fq "EnvironmentFile=${PROJECT_DIR}/.env.production" <<<"$unit_text"; then pass "Systemd secret handling" "Protected environment file is referenced.";
else warn "Systemd secret handling" "Expected EnvironmentFile reference was not confirmed."; fi
if has systemd-analyze && systemd-analyze security "$APP_SERVICE" --no-pager >/dev/null 2>&1; then pass "Systemd security review" "systemd-analyze security completed."; else warn "Systemd security review" "systemd-analyze security could not assess the service."; fi
check_root_config_tree /etc/systemd/system/boomotech.service "Systemd unit permissions"

if systemctl is-active --quiet nginx; then pass "Nginx service" "Nginx is active."; else fail "Nginx service" "Nginx is not active."; fi
if nginx -t >/dev/null 2>&1; then pass "Nginx configuration" "nginx -t passed."; else fail "Nginx configuration" "nginx -t failed or Nginx is unavailable."; fi
nginx_text="$(nginx -T 2>/dev/null || true)"
if grep -Fq 'proxy_pass http://127.0.0.1:3000' <<<"$nginx_text"; then pass "Nginx upstream" "Proxy targets loopback Next.js."; else fail "Nginx upstream" "Expected 127.0.0.1:3000 proxy target was not found."; fi
real_ip_sources="$(grep -Eo 'set_real_ip_from[[:space:]]+[^;[:space:]]+' <<<"$nginx_text" | awk '{print $2}' | sort -u || true)"
untrusted_real_ip_sources="$(grep -Ev '^(127\.0\.0\.1|::1)$' <<<"$real_ip_sources" || true)"
if [[ -n "$untrusted_real_ip_sources" ]]; then fail "Cloudflare real IP" "CF-Connecting-IP trust includes a non-loopback source; review the active tunnel origin.";
elif grep -Fq 'real_ip_header CF-Connecting-IP' <<<"$nginx_text" && grep -Eq 'set_real_ip_from (127\.0\.0\.1|::1)' <<<"$nginx_text"; then pass "Cloudflare real IP" "Header trust is scoped to a loopback tunnel source.";
else warn "Cloudflare real IP" "Review CF-Connecting-IP trust against the active local tunnel origin."; fi
if grep -Eq 'listen[[:space:]]+(80|443)([[:space:]]|;)' <<<"$nginx_text"; then warn "Nginx binding" "A non-explicit listen directive exists; confirm whether Nginx binds publicly."; else pass "Nginx binding" "No generic public listen directive was detected."; fi
if systemctl is-active --quiet cloudflared; then pass "Cloudflare Tunnel" "cloudflared is active."; else fail "Cloudflare Tunnel" "cloudflared is not active."; fi
check_root_config_tree /etc/nginx "Nginx config permissions"
check_root_config_tree /etc/cloudflared "Cloudflare config permissions"
cloudflared_unit="$(systemctl cat cloudflared 2>/dev/null || true)"
if grep -Eq '(^|[[:space:]])--token(=|[[:space:]])[^[:space:]]+' <<<"$cloudflared_unit"; then fail "Cloudflare token storage" "A tunnel token appears embedded in the systemd unit; move it to a root-protected credential file."; else pass "Cloudflare token storage" "No tunnel token was detected in the unit text."; fi
cloudflare_bad=""
if [[ -d /etc/cloudflared ]]; then
  cloudflare_bad="$(find /etc/cloudflared -maxdepth 1 -type f \( -name '*.json' -o -name '*.pem' \) \( ! -user root -o ! -perm 0600 \) -print -quit 2>/dev/null || true)"
fi
if [[ -z "$cloudflare_bad" ]]; then pass "Cloudflare credentials" "No non-root or group/world-accessible credential file was detected."; else fail "Cloudflare credentials" "A Cloudflare credential file has unsafe ownership or mode."; fi

headers="$(curl --silent --show-error --head --max-time 15 "$PUBLIC_URL" 2>/dev/null || true)"
if grep -Eqi '^strict-transport-security:[[:space:]]*max-age=86400' <<<"$headers"; then pass "HSTS" "Conservative production HSTS is present."; else fail "HSTS" "Expected production Strict-Transport-Security header was not found."; fi
for header in content-security-policy referrer-policy permissions-policy x-content-type-options x-frame-options; do
  if grep -Eqi "^${header}:" <<<"$headers"; then pass "HTTP ${header}" "Header is present."; else fail "HTTP ${header}" "Header is missing."; fi
done
if curl --fail --silent --show-error --max-time 15 --output /dev/null "$PUBLIC_URL"; then pass "Public website" "HTTPS request succeeded."; else fail "Public website" "HTTPS request failed."; fi
if curl --fail --silent --show-error --max-time 10 --output /dev/null http://127.0.0.1:3000/; then pass "Local Next.js" "Loopback application request succeeded."; else fail "Local Next.js" "Loopback application request failed."; fi
if curl --fail --silent --show-error --max-time 10 --output /dev/null http://127.0.0.1/; then pass "Local Nginx" "Loopback proxy request succeeded."; else fail "Local Nginx" "Loopback proxy request failed."; fi

if timedatectl show -p NTPSynchronized --value 2>/dev/null | grep -qx yes; then pass "Time synchronisation" "System clock is synchronised."; else warn "Time synchronisation" "NTP synchronisation was not confirmed."; fi
if systemctl is-active --quiet systemd-timesyncd 2>/dev/null; then pass "Time service" "systemd-timesyncd is active."; else warn "Time service" "systemd-timesyncd is inactive; another approved NTP service may be in use."; fi
if has aa-status; then
  if aa-status --enabled >/dev/null 2>&1; then pass "AppArmor" "AppArmor is enabled."; else warn "AppArmor" "AppArmor is installed but not enabled."; fi
else warn "AppArmor" "aa-status is unavailable."; fi
if has uname; then pass "Kernel version" "Running kernel: $(uname -r)."; else warn "Kernel version" "uname is unavailable."; fi
if has apt-get; then
  security_updates="$(apt-get -s -o Debug::NoLocking=true upgrade 2>/dev/null | grep -Ec '^Inst .*(security|Ubuntu[[:space:]]+ESM)' || true)"
  if (( ${security_updates:-0} > 0 )); then warn "Security updates" "${security_updates} security-related package update(s) appear available."; else pass "Security updates" "No pending security-related package update was detected."; fi
else warn "Security updates" "apt-get is unavailable; update status was not assessed."; fi

printf '\nSummary: %d warning(s), %d critical finding(s).\n' "$WARNING_COUNT" "$FAIL_COUNT"
if (( FAIL_COUNT > 0 )); then exit 2; fi
if (( WARNING_COUNT > 0 )); then exit 1; fi
exit 0
