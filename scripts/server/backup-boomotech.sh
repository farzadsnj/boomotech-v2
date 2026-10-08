#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
BACKUP_ROOT="${BOOMOTECH_BACKUP_ROOT:-/var/backups/boomotech}"
LOG_DIR="${BOOMOTECH_BACKUP_LOG_DIR:-/var/log/boomotech-backup}"
LOCK_FILE="${BOOMOTECH_BACKUP_LOCK_FILE:-/run/lock/boomotech-backup.lock}"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

log() {
  local message
  message="$(date --iso-8601=seconds) $*"
  printf '%s\n' "$message"
  if [[ "$DRY_RUN" == false ]]; then printf '%s\n' "$message" >> "${LOG_DIR}/backup.log"; fi
}

fail() { log "ERROR: $*"; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "Required command is unavailable: $1"; }

[[ $EUID -eq 0 ]] || fail "Run this script as root so protected configuration can be read."
for command_name in pg_dump pg_restore psql tar flock find runuser realpath stat basename chown; do require_command "$command_name"; done
[[ -r "$ENV_FILE" ]] || fail "Production environment file is not readable: $ENV_FILE"

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run: would back up PostgreSQL and approved configuration from ${PROJECT_DIR} into ${BACKUP_ROOT}."
  log "Dry run: would validate the custom-format dump with pg_restore --list and retain 7 daily, 4 weekly and 3 monthly copies."
  exit 0
fi

mkdir -p "$LOG_DIR" "$BACKUP_ROOT"/{database,config}/{daily,weekly,monthly}
exec 9>"$LOCK_FILE"
flock -n 9 || fail "Another BoomoTech backup is already running."

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is missing from $ENV_FILE"

timestamp="$(date -u +%Y-%m-%d-%H%M%S)"
database_name="boomotech-${timestamp}.dump"
config_name="boomotech-config-${timestamp}.tar.gz"
database_temp="${BACKUP_ROOT}/database/daily/.${database_name}.tmp"
database_final="${BACKUP_ROOT}/database/daily/${database_name}"
config_temp="${BACKUP_ROOT}/config/daily/.${config_name}.tmp"
config_final="${BACKUP_ROOT}/config/daily/${config_name}"

cleanup() { rm -f "$database_temp" "$config_temp"; }
trap cleanup EXIT

log "Starting PostgreSQL backup."
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$database_temp"
[[ -s "$database_temp" ]] || fail "PostgreSQL backup is empty."
pg_restore --list "$database_temp" >/dev/null || fail "PostgreSQL backup validation failed."
mv "$database_temp" "$database_final"
chmod 600 "$database_final"
log "Validated PostgreSQL backup: $database_final"

config_paths=()
for path in \
  "$ENV_FILE" \
  /etc/systemd/system/boomotech.service \
  /etc/systemd/system/boomotech.service.d \
  /etc/nginx/nginx.conf \
  /etc/nginx/sites-available \
  /etc/nginx/sites-enabled \
  /etc/cloudflared \
  /etc/ssh/sshd_config.d/99-boomotech-hardening.conf \
  /etc/fail2ban/jail.d/boomotech.local \
  /etc/fail2ban/jail.d/zz-boomotech-ignore.local \
  /etc/apt/apt.conf.d/20auto-upgrades \
  /etc/apt/apt.conf.d/52unattended-upgrades-boomotech \
  /etc/ufw \
  /etc/default/ufw; do
  if [[ -e "$path" ]]; then config_paths+=("${path#/}"); fi
done

add_postgresql_config() {
  local path="$1" expected_name="$2" resolved owner
  [[ -n "$path" && "$path" == /* && "$(basename -- "$path")" == "$expected_name" && -r "$path" ]] || fail "Active PostgreSQL $expected_name path is invalid or unreadable."
  resolved="$(realpath -e -- "$path")" || fail "Active PostgreSQL $expected_name path could not be resolved."
  owner="$(stat -c '%U' "$resolved")"
  [[ "$owner" == "postgres" || "$owner" == "root" ]] || fail "Active PostgreSQL $expected_name is not owned by postgres or root."
  config_paths+=("${resolved#/}")
}

postgresql_config_file="$(runuser -u postgres -- psql --no-psqlrc -Atqc 'SHOW config_file;' 2>/dev/null || true)"
postgresql_hba_file="$(runuser -u postgres -- psql --no-psqlrc -Atqc 'SHOW hba_file;' 2>/dev/null || true)"
postgresql_ident_file="$(runuser -u postgres -- psql --no-psqlrc -Atqc 'SHOW ident_file;' 2>/dev/null || true)"
postgresql_data_directory="$(runuser -u postgres -- psql --no-psqlrc -Atqc 'SHOW data_directory;' 2>/dev/null || true)"
add_postgresql_config "$postgresql_config_file" postgresql.conf
add_postgresql_config "$postgresql_hba_file" pg_hba.conf
add_postgresql_config "$postgresql_ident_file" pg_ident.conf
if [[ -n "$postgresql_data_directory" && "$postgresql_data_directory" == /* && -f "$postgresql_data_directory/postgresql.auto.conf" ]]; then
  add_postgresql_config "$postgresql_data_directory/postgresql.auto.conf" postgresql.auto.conf
fi

[[ ${#config_paths[@]} -gt 0 ]] || fail "No approved configuration paths were found."
tar --create --gzip --file="$config_temp" --directory=/ --warning=no-file-changed "${config_paths[@]}"
[[ -s "$config_temp" ]] || fail "Configuration backup is empty."
tar --list --gzip --file="$config_temp" >/dev/null || fail "Configuration archive validation failed."
mv "$config_temp" "$config_final"
chown root:root "$config_final"
chmod 600 "$config_final"
log "Validated configuration backup: $config_final"

copy_periodic() {
  local source_file="$1" destination_dir="$2"
  cp --preserve=timestamps "$source_file" "$destination_dir/$(basename "$source_file")"
  chmod 600 "$destination_dir/$(basename "$source_file")"
}

if [[ "$(date -u +%u)" == "7" ]]; then
  copy_periodic "$database_final" "$BACKUP_ROOT/database/weekly"
  copy_periodic "$config_final" "$BACKUP_ROOT/config/weekly"
  log "Created weekly backup copies."
fi
if [[ "$(date -u +%d)" == "01" ]]; then
  copy_periodic "$database_final" "$BACKUP_ROOT/database/monthly"
  copy_periodic "$config_final" "$BACKUP_ROOT/config/monthly"
  log "Created monthly backup copies."
fi

prune_directory() {
  local directory="$1" keep="$2"
  mapfile -t files < <(find "$directory" -maxdepth 1 -type f -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-)
  if (( ${#files[@]} > keep )); then
    for ((index=keep; index<${#files[@]}; index++)); do rm -f -- "${files[$index]}"; done
  fi
}

for kind in database config; do
  prune_directory "$BACKUP_ROOT/$kind/daily" 7
  prune_directory "$BACKUP_ROOT/$kind/weekly" 4
  prune_directory "$BACKUP_ROOT/$kind/monthly" 3
done

log "Backup and retention completed successfully."
