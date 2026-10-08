#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${SCRIPT_DIR}/security"
PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
APP_USER="${BOOMOTECH_APP_USER:-boomotechhost}"
APP_GROUP="${BOOMOTECH_APP_GROUP:-${APP_USER}}"
BACKUP_ROOT="${BOOMOTECH_SECURITY_BACKUP_ROOT:-/var/backups/boomotech/security-config}"
SSH_ALLOW_CIDR="${BOOMOTECH_SSH_ALLOW_CIDR:-}"
FAIL2BAN_IGNORE_CIDR="${BOOMOTECH_FAIL2BAN_IGNORE_CIDR:-}"
POSTGRES_CONFIG_DIR="${BOOMOTECH_POSTGRES_CONFIG_DIR:-}"

audit_only=true
audit_explicit=false
install_base=false
apply_permissions=false
install_fail2ban=false
enable_updates=false
install_systemd_dropin=false
apply_ssh=false
apply_firewall=false
apply_postgresql=false
lockout_acknowledged=false
backup_dir=""

usage() {
  cat <<'EOF'
Usage: sudo scripts/server/install-security-hardening.sh [options]

With no mutation option, the script runs the read-only security audit.

Low-risk, independently selectable options:
  --install-base                  Install the documented security packages.
  --apply-permissions             Tighten approved app, SSH, backup and log paths.
  --install-fail2ban              Install and validate the BoomoTech SSH jail.
  --enable-unattended-upgrades    Install the no-auto-reboot update policy.
  --install-systemd-drop-in       Install the application service hardening drop-in.

High-risk options (each also requires --yes-i-understand-lockout-risk):
  --apply-ssh                     Validate and install the SSH hardening drop-in.
  --apply-firewall                Restrict SSH and remove public app/database/web rules.
  --apply-postgresql              Restrict PostgreSQL to loopback and SCRAM.

Required inputs:
  --ssh-allow-cidr CIDR           Management IPv4/IPv6 CIDR for --apply-firewall.
  --fail2ban-ignore-cidr CIDR     Optional trusted CIDR for the SSH jail.
  --postgres-config-dir DIR       PostgreSQL directory containing pg_hba.conf.
  --yes-i-understand-lockout-risk Confirm console/recovery access and a tested SSH key.

Other:
  --audit-only                    Explicitly run only the read-only audit.
  -h, --help                      Show this help.

Run one high-risk operation at a time and keep the current SSH session open until a
second key-authenticated session succeeds. The script never changes production unless
an explicit mutation option is supplied.
EOF
}

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
log() { printf '%s\n' "$*"; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "Required command is unavailable: $1"; }

while (($#)); do
  case "$1" in
    --audit-only) audit_only=true; audit_explicit=true ;;
    --install-base) audit_only=false; install_base=true ;;
    --apply-permissions) audit_only=false; apply_permissions=true ;;
    --install-fail2ban) audit_only=false; install_fail2ban=true ;;
    --enable-unattended-upgrades) audit_only=false; enable_updates=true ;;
    --install-systemd-drop-in) audit_only=false; install_systemd_dropin=true ;;
    --apply-ssh) audit_only=false; apply_ssh=true ;;
    --apply-firewall) audit_only=false; apply_firewall=true ;;
    --apply-postgresql) audit_only=false; apply_postgresql=true ;;
    --ssh-allow-cidr)
      shift
      (($#)) || fail "--ssh-allow-cidr requires a value."
      SSH_ALLOW_CIDR="$1"
      ;;
    --postgres-config-dir)
      shift
      (($#)) || fail "--postgres-config-dir requires a value."
      POSTGRES_CONFIG_DIR="$1"
      ;;
    --fail2ban-ignore-cidr)
      shift
      (($#)) || fail "--fail2ban-ignore-cidr requires a value."
      FAIL2BAN_IGNORE_CIDR="$1"
      ;;
    --yes-i-understand-lockout-risk) lockout_acknowledged=true ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Unknown argument: $1" ;;
  esac
  shift
done

if [[ "$audit_explicit" == true ]] && [[ "$install_base" == true || "$apply_permissions" == true || "$install_fail2ban" == true || "$enable_updates" == true || "$install_systemd_dropin" == true || "$apply_ssh" == true || "$apply_firewall" == true || "$apply_postgresql" == true ]]; then
  fail "--audit-only cannot be combined with a mutation option."
fi

if [[ "$audit_only" == true ]]; then
  exec "${SCRIPT_DIR}/security-audit.sh"
fi

[[ $EUID -eq 0 ]] || fail "Mutation options must be run as root."
for command_name in install stat find systemctl; do require_command "$command_name"; done

if [[ "$apply_ssh" == true || "$apply_firewall" == true || "$apply_postgresql" == true ]]; then
  [[ "$lockout_acknowledged" == true ]] || fail "High-risk changes require --yes-i-understand-lockout-risk. Read docs/SERVER-SECURITY.md first."
fi

validate_cidr() {
  local value="$1"
  require_command python3
  python3 - "$value" <<'PY'
import ipaddress
import sys

try:
    ipaddress.ip_network(sys.argv[1], strict=False)
except ValueError:
    raise SystemExit(1)
PY
}

ensure_backup_dir() {
  if [[ -z "$backup_dir" ]]; then
    backup_dir="${BACKUP_ROOT}/$(date -u +%Y-%m-%d-%H%M%S)-$$"
    install -d -o root -g root -m 0700 "$backup_dir"
    log "Configuration backups: $backup_dir"
  fi
}

backup_file() {
  local source="$1" relative destination
  [[ -e "$source" || -L "$source" ]] || return 0
  ensure_backup_dir
  relative="${source#/}"
  destination="${backup_dir}/${relative}"
  install -d -o root -g root -m 0700 "$(dirname -- "$destination")"
  cp -a -- "$source" "$destination"
  log "Backed up $source"
}

install_template() {
  local source="$1" destination="$2" mode="${3:-0644}"
  [[ -f "$source" ]] || fail "Template is unavailable: $source"
  backup_file "$destination"
  install -D -o root -g root -m "$mode" "$source" "$destination"
  log "Installed $destination"
}

if [[ "$install_base" == true ]]; then
  require_command apt-get
  require_command dpkg-query
  ensure_backup_dir
  dpkg-query -W -f='${binary:Package}\t${Version}\n' > "$backup_dir/packages.before.tsv"
  chmod 0600 "$backup_dir/packages.before.tsv"
  log "Installing documented security and operations packages (no distribution upgrade)."
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ufw fail2ban unattended-upgrades vnstat curl postgresql-client apparmor-utils
fi

if [[ "$apply_permissions" == true ]]; then
  id "$APP_USER" >/dev/null 2>&1 || fail "Application user does not exist: $APP_USER"
  [[ -d "$PROJECT_DIR" ]] || fail "Project directory does not exist: $PROJECT_DIR"
  app_home="$(getent passwd "$APP_USER" | cut -d: -f6)"
  [[ -n "$app_home" ]] || fail "Home directory for $APP_USER could not be determined."

  ensure_backup_dir
  permissions_manifest="$backup_dir/permissions.before.txt"
  for protected_path in "$ENV_FILE" "$app_home/.ssh" "$app_home/.ssh/authorized_keys" /var/backups/boomotech /var/log/boomotech-backup /var/log/boomotech-monitor /var/log/boomotech-deploy; do
    [[ -e "$protected_path" ]] && stat -c '%U:%G:%a %n' "$protected_path" >> "$permissions_manifest"
  done
  [[ -d "$app_home/.ssh" ]] && find "$app_home/.ssh" -maxdepth 1 -type f -exec stat -c '%U:%G:%a %n' {} + >> "$permissions_manifest"
  [[ -d /var/backups/boomotech ]] && find /var/backups/boomotech -xdev -type f -exec stat -c '%U:%G:%a %n' {} + >> "$permissions_manifest"
  chmod 0600 "$permissions_manifest"

  if [[ -e "$ENV_FILE" ]]; then
    chown "$APP_USER:$APP_GROUP" "$ENV_FILE"
    chmod 0600 "$ENV_FILE"
  fi
  if [[ -d "$app_home/.ssh" ]]; then
    chown "$APP_USER:$APP_GROUP" "$app_home/.ssh"
    chmod 0700 "$app_home/.ssh"
    find "$app_home/.ssh" -maxdepth 1 -type f -exec chown "$APP_USER:$APP_GROUP" {} + -exec chmod 0600 {} +
  fi
  install -d -o root -g root -m 0700 /var/backups/boomotech
  find /var/backups/boomotech -xdev -type f -exec chmod 0600 {} +
  install -d -o root -g "$APP_GROUP" -m 0750 /var/log/boomotech-backup /var/log/boomotech-monitor
  install -d -o "$APP_USER" -g "$APP_GROUP" -m 0750 /var/log/boomotech-deploy
  log "Applied least-access permissions to approved environment, SSH, backup and log paths."
fi

if [[ "$install_fail2ban" == true ]]; then
  require_command fail2ban-client
  if [[ -n "$FAIL2BAN_IGNORE_CIDR" ]]; then validate_cidr "$FAIL2BAN_IGNORE_CIDR" || fail "Invalid Fail2ban ignore CIDR: $FAIL2BAN_IGNORE_CIDR"; fi
  legacy_ignore_override=/etc/fail2ban/jail.d/boomotech-ignore.local
  ignore_override=/etc/fail2ban/jail.d/zz-boomotech-ignore.local
  if [[ -e "$legacy_ignore_override" && -z "$FAIL2BAN_IGNORE_CIDR" ]]; then
    fail "Legacy Fail2ban ignore override exists. Re-run with the exact approved --fail2ban-ignore-cidr to migrate it safely."
  fi
  install_template "$TEMPLATE_DIR/fail2ban-boomotech.local" /etc/fail2ban/jail.d/boomotech.local
  if [[ -n "$FAIL2BAN_IGNORE_CIDR" ]]; then
    backup_file "$legacy_ignore_override"
    backup_file "$ignore_override"
    ignore_temp="$(mktemp)"
    printf '[DEFAULT]\nignoreip = 127.0.0.1/8 ::1 %s\n' "$FAIL2BAN_IGNORE_CIDR" > "$ignore_temp"
    install -o root -g root -m 0644 "$ignore_temp" "$ignore_override"
    rm -f "$ignore_temp"
    rm -f "$legacy_ignore_override"
  fi
  fail2ban-client -t
  systemctl enable --now fail2ban
  systemctl reload fail2ban
  if [[ -n "$FAIL2BAN_IGNORE_CIDR" ]]; then
    effective_ignore="$(fail2ban-client get sshd ignoreip 2>/dev/null || true)"
    grep -Fq -- "$FAIL2BAN_IGNORE_CIDR" <<<"$effective_ignore" || fail "Fail2ban reloaded, but the requested trusted CIDR is not effective in the sshd jail."
    log "Verified the requested trusted CIDR in the effective sshd jail configuration."
  fi
  log "Fail2ban configuration validated and SSH jail enabled."
fi

if [[ "$enable_updates" == true ]]; then
  require_command apt-config
  apt-config -c "$TEMPLATE_DIR/20auto-upgrades-boomotech.example" dump >/dev/null
  apt-config -c "$TEMPLATE_DIR/52unattended-upgrades-boomotech.example" dump >/dev/null
  install_template "$TEMPLATE_DIR/20auto-upgrades-boomotech.example" /etc/apt/apt.conf.d/20auto-upgrades
  install_template "$TEMPLATE_DIR/52unattended-upgrades-boomotech.example" /etc/apt/apt.conf.d/52unattended-upgrades-boomotech
  apt-config dump >/dev/null
  systemctl enable --now apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service
  log "Unattended security updates enabled with automatic reboot disabled."
fi

if [[ "$install_systemd_dropin" == true ]]; then
  require_command systemd-analyze
  [[ -f /etc/systemd/system/boomotech.service ]] || fail "boomotech.service is not installed."
  install -d -o "$APP_USER" -g "$APP_GROUP" -m 0750 "$PROJECT_DIR/.next/cache"
  systemd_dropin=/etc/systemd/system/boomotech.service.d/hardening.conf
  install_template "$TEMPLATE_DIR/boomotech-hardening.conf.example" "$systemd_dropin"
  systemctl daemon-reload
  if ! systemd-analyze verify boomotech.service; then
    if [[ -f "$backup_dir/${systemd_dropin#/}" ]]; then cp -a "$backup_dir/${systemd_dropin#/}" "$systemd_dropin"; else rm -f "$systemd_dropin"; fi
    systemctl daemon-reload
    fail "Systemd verification failed; the previous drop-in was restored."
  fi
  log "Systemd drop-in installed and verified. Restart boomotech.service only during an approved maintenance window."
fi

if [[ "$apply_ssh" == true ]]; then
  require_command sshd
  app_home="$(getent passwd "$APP_USER" 2>/dev/null | cut -d: -f6)"
  [[ -n "$app_home" && -s "$app_home/.ssh/authorized_keys" ]] || fail "A non-empty authorised_keys file for $APP_USER is required before disabling password authentication."
  [[ "$(stat -c '%U:%a' "$app_home/.ssh" 2>/dev/null)" == "$APP_USER:700" ]] || fail "Fix $app_home/.ssh ownership/mode first (expected $APP_USER:700)."
  [[ "$(stat -c '%U:%a' "$app_home/.ssh/authorized_keys" 2>/dev/null)" == "$APP_USER:600" ]] || fail "Fix authorized_keys ownership/mode first (expected $APP_USER:600)."
  install_template "$TEMPLATE_DIR/sshd-boomotech.conf.example" /etc/ssh/sshd_config.d/99-boomotech-hardening.conf
  if ! sshd -t; then
    if [[ -f "$backup_dir/etc/ssh/sshd_config.d/99-boomotech-hardening.conf" ]]; then
      cp -a "$backup_dir/etc/ssh/sshd_config.d/99-boomotech-hardening.conf" /etc/ssh/sshd_config.d/99-boomotech-hardening.conf
    else
      rm -f /etc/ssh/sshd_config.d/99-boomotech-hardening.conf
    fi
    fail "SSH validation failed; the previous drop-in was restored."
  fi
  systemctl reload ssh
  log "SSH reloaded. KEEP THIS SESSION OPEN and verify a second key-authenticated session before disconnecting."
fi

if [[ "$apply_firewall" == true ]]; then
  require_command ufw
  [[ -n "$SSH_ALLOW_CIDR" ]] || fail "--apply-firewall requires --ssh-allow-cidr CIDR."
  validate_cidr "$SSH_ALLOW_CIDR" || fail "Invalid SSH management CIDR: $SSH_ALLOW_CIDR"
  backup_file /etc/ufw
  backup_file /etc/default/ufw
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow from "$SSH_ALLOW_CIDR" to any port 22 proto tcp comment 'BoomoTech management SSH'
  for destination_pattern in '(OpenSSH|22/tcp)' '80/tcp' '443/tcp' '3000/tcp' '5432/tcp'; do
    mapfile -t public_rule_numbers < <(ufw status numbered | grep -E "${destination_pattern}([[:space:]]+\(v6\))?[[:space:]]+ALLOW IN[[:space:]]+Anywhere([[:space:]]+\(v6\))?([[:space:]]|$)" | sed -nE 's/^\[[[:space:]]*([0-9]+)\].*/\1/p' | sort -rn)
    for rule_number in "${public_rule_numbers[@]}"; do
      ufw --force delete "$rule_number"
    done
  done
  ufw --force enable
  ufw status verbose
  log "Firewall applied. KEEP THIS SESSION OPEN and verify a second SSH session from $SSH_ALLOW_CIDR."
fi

if [[ "$apply_postgresql" == true ]]; then
  require_command psql
  require_command runuser
  require_command realpath
  [[ -n "$POSTGRES_CONFIG_DIR" && -d "$POSTGRES_CONFIG_DIR" ]] || fail "--apply-postgresql requires an existing --postgres-config-dir."
  [[ -r "$ENV_FILE" ]] || fail "Production environment is not readable: $ENV_FILE"
  hba_file="$POSTGRES_CONFIG_DIR/pg_hba.conf"
  postgres_conf="$POSTGRES_CONFIG_DIR/postgresql.conf"
  auto_conf="$POSTGRES_CONFIG_DIR/postgresql.auto.conf"
  auto_conf_existed=false
  [[ -e "$auto_conf" ]] && auto_conf_existed=true
  [[ -r "$hba_file" && -r "$postgres_conf" ]] || fail "PostgreSQL config directory must contain pg_hba.conf and postgresql.conf."
  active_hba_path="$(runuser -u postgres -- psql -Atqc 'SHOW hba_file;' 2>/dev/null || true)"
  [[ -n "$active_hba_path" && "$(realpath "$active_hba_path")" == "$(realpath "$hba_file")" ]] || fail "The supplied PostgreSQL config directory does not match the active cluster."
  active_hba="$(sed -E 's/[[:space:]]*#.*$//' "$hba_file" | sed '/^[[:space:]]*$/d')"
  if grep -Eq '(^|[[:space:]])(0\.0\.0\.0/0|::/0)([[:space:]]|$)|(^|[[:space:]])trust([[:space:]]|$)' <<<"$active_hba"; then
    fail "Unsafe active pg_hba.conf rules detected. Review and replace them manually using the supplied template before continuing."
  fi
  backup_file "$postgres_conf"
  backup_file "$hba_file"
  backup_file "$auto_conf"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  [[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is missing from $ENV_FILE."
  psql "$DATABASE_URL" -Atqc 'SELECT 1;' | grep -qx 1 || fail "Application database connection failed before PostgreSQL hardening; no setting was changed."
  runuser -u postgres -- psql --set=ON_ERROR_STOP=1 --command="ALTER SYSTEM SET listen_addresses = 'localhost';" --command="ALTER SYSTEM SET password_encryption = 'scram-sha-256';"
  config_errors="$(runuser -u postgres -- psql -Atqc "SELECT count(*) FROM pg_file_settings WHERE error IS NOT NULL;" 2>/dev/null || printf '1')"
  if [[ "$config_errors" != "0" ]]; then
    if [[ "$auto_conf_existed" == true ]]; then cp -a "$backup_dir/${auto_conf#/}" "$auto_conf"; else rm -f "$auto_conf"; fi
    fail "PostgreSQL reported a configuration error; postgresql.auto.conf was restored."
  fi
  systemctl reload postgresql
  pg_encryption="$(runuser -u postgres -- psql -Atqc 'SHOW password_encryption;')"
  if [[ "$pg_encryption" != "scram-sha-256" ]] || ! psql "$DATABASE_URL" -Atqc 'SELECT 1;' | grep -qx 1; then
    if [[ "$auto_conf_existed" == true ]]; then cp -a "$backup_dir/${auto_conf#/}" "$auto_conf"; else rm -f "$auto_conf"; fi
    systemctl reload postgresql || true
    fail "PostgreSQL verification failed; postgresql.auto.conf was restored and reloaded."
  fi
  log "PostgreSQL SCRAM setting and application access passed. listen_addresses is staged for the next separately approved service restart; it is not changed at runtime by this script."
fi

log "Selected changes completed. Running the read-only audit; findings may remain until every separately approved step is applied."
"${SCRIPT_DIR}/security-audit.sh" || audit_status=$?
exit "${audit_status:-0}"
