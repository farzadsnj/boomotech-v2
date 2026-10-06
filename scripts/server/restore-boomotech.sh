#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

DUMP_FILE=""
KEEP_TEST_DATABASE=false

usage() {
  cat <<'EOF'
Usage: sudo ./restore-boomotech.sh --dump /var/backups/boomotech/database/daily/file.dump [--keep-test-database]

This command restores only into a newly generated test database. It never targets the production database.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dump) DUMP_FILE="${2:-}"; shift 2 ;;
    --keep-test-database) KEEP_TEST_DATABASE=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || fail "Run as root so the local postgres account can create an isolated test database."
[[ -n "$DUMP_FILE" && -f "$DUMP_FILE" && -s "$DUMP_FILE" ]] || fail "Provide a readable, non-empty custom-format dump with --dump."
command -v pg_restore >/dev/null 2>&1 || fail "pg_restore is unavailable."
command -v psql >/dev/null 2>&1 || fail "psql is unavailable."
command -v runuser >/dev/null 2>&1 || fail "runuser is unavailable."
pg_restore --list "$DUMP_FILE" >/dev/null || fail "The dump failed pg_restore --list validation."

test_database="boomotech_restore_test_$(date -u +%Y%m%d%H%M%S)_$$"
[[ "$test_database" =~ ^boomotech_restore_test_[0-9_]+$ ]] || fail "Unsafe generated database name."

cleanup() {
  if [[ "$KEEP_TEST_DATABASE" == false ]]; then
    runuser -u postgres -- dropdb --if-exists "$test_database" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

printf 'Creating isolated restore-test database %s.\n' "$test_database"
runuser -u postgres -- createdb "$test_database"
runuser -u postgres -- pg_restore --exit-on-error --no-owner --no-privileges --dbname="$test_database" < "$DUMP_FILE"

table_count="$(runuser -u postgres -- psql --dbname="$test_database" --tuples-only --no-align --command="SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
[[ "$table_count" =~ ^[0-9]+$ && "$table_count" -gt 0 ]] || fail "Restore completed without application tables."

required_tables=("user" "account" "session" "booking_request")
for table_name in "${required_tables[@]}"; do
  exists="$(runuser -u postgres -- psql --dbname="$test_database" --tuples-only --no-align --command="SELECT to_regclass('public.' || quote_ident('$table_name')) IS NOT NULL;")"
  [[ "$exists" == "t" ]] || fail "Restore is missing required table: $table_name"
done

runuser -u postgres -- psql --dbname="$test_database" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="SELECT current_database(), count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' GROUP BY current_database();"

printf 'Restore test passed with %s public tables and all required BoomoTech tables.\n' "$table_count"
if [[ "$KEEP_TEST_DATABASE" == true ]]; then
  printf 'Test database retained for manual inspection: %s\n' "$test_database"
else
  printf 'The isolated test database will now be removed.\n'
fi
