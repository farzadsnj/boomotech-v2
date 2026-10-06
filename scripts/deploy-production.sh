#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

PROJECT_DIR="${BOOMOTECH_PROJECT_DIR:-/var/www/boomotech}"
ENV_FILE="${BOOMOTECH_ENV_FILE:-${PROJECT_DIR}/.env.production}"
LOCAL_HEALTH_URL="${BOOMOTECH_LOCAL_HEALTH_URL:-http://127.0.0.1:3000/}"
DEPLOY_LOG_DIR="${BOOMOTECH_DEPLOY_LOG_DIR:-/var/log/boomotech-deploy}"
FAST=false
DRY_RUN=false

for argument in "$@"; do
  case "$argument" in
    --fast) FAST=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      printf 'Usage: %s [--fast] [--dry-run]\n' "$0"
      printf '  --fast skips lint, type-check and unit tests; migration and build still run.\n'
      exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; exit 2 ;;
  esac
done

log() { printf '%s %s\n' "$(date --iso-8601=seconds)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "Required command is unavailable: $1"; }

[[ $EUID -ne 0 ]] || fail "Run deployment as the dedicated application user, not root."
[[ -d "$PROJECT_DIR/.git" ]] || fail "Git checkout is unavailable: $PROJECT_DIR"
cd "$PROJECT_DIR"
[[ -r "$ENV_FILE" ]] || fail "Production environment file is not readable: $ENV_FILE"
[[ -z "$(git status --porcelain)" ]] || fail "The working tree is not clean. Commit or remove local changes first."
[[ "$(git branch --show-current)" == "main" ]] || fail "Production deployment must run from the main branch."
for command_name in git pnpm curl flock sudo; do require_command "$command_name"; done

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
required_variables=(SITE_URL DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_URL BOOKING_NOTIFICATION_EMAIL BOOKING_FROM_EMAIL RESEND_API_KEY OPENAI_API_KEY)
for variable in "${required_variables[@]}"; do [[ -n "${!variable:-}" ]] || fail "$variable is missing from $ENV_FILE"; done
[[ "$SITE_URL" =~ ^https:// ]] || fail "SITE_URL must be the approved HTTPS production origin."
[[ "$BETTER_AUTH_URL" == "$SITE_URL" ]] || fail "BETTER_AUTH_URL must exactly match SITE_URL."
[[ "${BOOKING_TRUST_PROXY:-false}" == "true" ]] || fail "BOOKING_TRUST_PROXY must be true behind the approved production proxy."

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run passed read-only preflight checks."
  log "Would: back up; fetch and fast-forward main; install locked dependencies; run checks; migrate; build; restart; run local and public health checks."
  [[ "$FAST" == true ]] && log "Fast mode would skip lint, type-check and unit tests."
  exit 0
fi

mkdir -p "$DEPLOY_LOG_DIR" 2>/dev/null || fail "Cannot write $DEPLOY_LOG_DIR. Provision it for the deployment user first."
exec > >(tee -a "${DEPLOY_LOG_DIR}/$(date -u +%Y-%m-%d).log") 2>&1
exec 9>"/run/lock/boomotech-deploy.lock"
flock -n 9 || fail "Another BoomoTech deployment is already running."

log "Creating and validating a pre-migration backup."
sudo "$PROJECT_DIR/scripts/server/backup-boomotech.sh"

log "Fast-forwarding the production checkout."
git fetch --prune origin
git pull --ff-only origin main

log "Installing dependencies from the lockfile."
pnpm install --frozen-lockfile
log "Validating the complete production environment."
pnpm prod:check
if [[ "$FAST" == false ]]; then
  log "Running lint, type-check and unit tests."
  pnpm lint
  pnpm typecheck
  pnpm test
else
  log "Fast mode: lint, type-check and unit tests were explicitly skipped."
fi

log "Applying committed database migrations."
pnpm db:migrate
log "Building the production application."
pnpm build

log "Restarting boomotech.service."
sudo systemctl restart boomotech.service

health_check() {
  local url="$1" label="$2"
  for attempt in {1..12}; do
    if curl --fail --silent --show-error --max-time 10 --output /dev/null "$url"; then log "$label health check passed: $url"; return 0; fi
    sleep 2
  done
  return 1
}

if ! health_check "$LOCAL_HEALTH_URL" "Local"; then
  sudo systemctl --no-pager --full status boomotech.service || true
  sudo journalctl --unit=boomotech.service --lines=80 --no-pager || true
  fail "Local health check failed after restart. Manual investigation is required."
fi
health_check "$SITE_URL" "Public" || fail "Public health check failed. The local service is running; inspect Nginx, DNS and tunnel configuration."
log "Deployment completed successfully."
