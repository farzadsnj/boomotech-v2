import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("server operations scripts", () => {
  it("creates and validates database and configuration backups with retention tiers", () => {
    const script = read("scripts/server/backup-boomotech.sh");
    expect(script).toContain('pg_dump --dbname="$DATABASE_URL" --format=custom');
    expect(script).toContain("pg_restore --list");
    expect(script).toContain("tar --list --gzip");
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/daily" 7');
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/weekly" 4');
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/monthly" 3');
    for (const path of [
      "/etc/systemd/system/boomotech.service",
      "/etc/systemd/system/boomotech.service.d",
      "/etc/nginx/nginx.conf",
      "/etc/nginx/sites-available",
      "/etc/nginx/sites-enabled",
      "/etc/cloudflared",
      "/etc/ssh/sshd_config.d/99-boomotech-hardening.conf",
      "/etc/fail2ban/jail.d/boomotech.local",
      "/etc/fail2ban/jail.d/zz-boomotech-ignore.local",
      "/etc/apt/apt.conf.d/20auto-upgrades",
      "/etc/apt/apt.conf.d/52unattended-upgrades-boomotech",
      "/etc/ufw",
      "/etc/default/ufw",
    ]) {
      expect(script).toContain(path);
    }
    for (const setting of ["config_file", "hba_file", "ident_file", "data_directory"]) {
      expect(script).toContain(`SHOW ${setting};`);
    }
    expect(script).toContain("postgresql.auto.conf");
    expect(script).toContain('chown root:root "$config_final"');
    expect(script).toContain('chmod 600 "$config_final"');
  });

  it("restores only into a generated restore-test database", () => {
    const script = read("scripts/server/restore-boomotech.sh");
    expect(script).toContain("boomotech_restore_test_");
    expect(script).toContain("pg_restore --exit-on-error");
    expect(script).toContain('--dbname="$test_database" < "$DUMP_FILE"');
    expect(script).toContain("dropdb --if-exists");
    for (const requiredTable of ["user", "account", "session", "booking_request"]) {
      expect(script).toContain(`"${requiredTable}"`);
    }
    expect(script).not.toContain("boomotech_production");
  });

  it("monitors network, resources, services, PostgreSQL, Nginx, HTTP health and security posture", () => {
    const script = read("scripts/server/boomotech-monitor.sh");
    for (const required of ["vnstat", "/proc/loadavg", "free -h", "df -Pk", "boomotech.service", "postgresql.service", "curl --fail", "access.log", "error.log"]) {
      expect(script).toContain(required);
    }
    expect(script).toContain("BOOMOTECH_DISK_WARNING_PERCENT:-80");
    expect(script).toContain("BOOMOTECH_DISK_CRITICAL_PERCENT:-90");
    expect(script).toContain('[[ "$filesystem" == "Filesystem" ]] && continue');
    expect(script).toContain('[[ ! "$percent" =~ ^[0-9]+%$ ]]');
    expect(script).toContain('psql "$DATABASE_URL"');
    expect(script).toContain('section "Security posture"');
    expect(script).toContain('section "Notification outbox"');
    expect(script).toContain('section "Notification worker"');
    expect(script).toContain("systemctl is-enabled boomotech-notification-worker.timer");
    expect(script).toContain("systemctl is-active boomotech-notification-worker.timer");
    expect(script).toContain("systemctl show boomotech-notification-worker.service --property=Result --value");
    expect(script).toContain("Notification worker timer is not ready");
    for (const aggregate of ["outbox_pending", "outbox_retrying", "outbox_failed", "outbox_oldest_minutes"]) expect(script).toContain(aggregate);
    for (const personalField of ["full_name", "email", "message", "phone"]) expect(script).not.toContain(`SELECT ${personalField}`);
  });

  it("keeps the deployment safety steps in the required order", () => {
    const script = read("scripts/deploy-production.sh");
    const ordered = [
      "git status --porcelain",
      "backup-boomotech.sh",
      "git fetch --prune origin",
      "git pull --ff-only origin main",
      "pnpm install --frozen-lockfile",
      "pnpm prod:check",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm test",
      "pnpm db:migrate",
      "pnpm build",
      "systemctl restart boomotech.service",
      'health_check "$LOCAL_HEALTH_URL"',
      'health_check "$SITE_URL"',
    ];
    let previous = -1;
    for (const value of ordered) {
      const position = script.indexOf(value);
      expect(position, `${value} should be present`).toBeGreaterThan(previous);
      previous = position;
    }
  });

  it("isolates production credentials and origins from deployment unit tests", () => {
    const script = read("scripts/deploy-production.sh");
    for (const variable of [
      "SITE_URL", "DATABASE_URL", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET",
      "RESEND_API_KEY", "AUTH_FROM_EMAIL", "BOOKING_NOTIFICATION_EMAIL", "BOOKING_FROM_EMAIL",
      "BOOKING_TRUST_PROXY", "OPENAI_API_KEY", "OPENAI_CHAT_MODEL",
    ]) {
      expect(script).toContain(`-u ${variable}`);
    }
    expect(script).toContain("NODE_ENV=test pnpm test");
    expect(script.indexOf("NODE_ENV=test pnpm test")).toBeLessThan(script.lastIndexOf('source "$ENV_FILE"'));
    expect(script.lastIndexOf('source "$ENV_FILE"')).toBeLessThan(script.indexOf("pnpm db:migrate"));
  });

  it("installs persistent nightly backup and daily monitoring timers", () => {
    const backupTimer = read("scripts/server/systemd/boomotech-backup.timer");
    const monitorTimer = read("scripts/server/systemd/boomotech-monitor.timer");
    expect(backupTimer).toContain("OnCalendar=*-*-* 02:00:00 Australia/Brisbane");
    expect(monitorTimer).toContain("OnCalendar=*-*-* 06:15:00 Australia/Brisbane");
    expect(backupTimer).toContain("Persistent=true");
    expect(monitorTimer).toContain("Persistent=true");
  });

  it("installs a hardened notification timer without processing notifications by default", () => {
    const service = read("scripts/server/systemd/boomotech-notification-worker.service");
    const timer = read("scripts/server/systemd/boomotech-notification-worker.timer");
    const installer = read("scripts/server/install-notification-worker.sh");
    const logrotate = read("scripts/server/logrotate-boomotech");
    expect(service).toContain("Type=oneshot");
    expect(service).toContain("EnvironmentFile=/var/www/boomotech/.env.production");
    expect(service).toContain("Environment=PATH=/usr/local/bin:/usr/bin:/bin");
    expect(service).toContain("ExecStartPre=/var/www/boomotech/node_modules/.bin/tsx scripts/check-notification-worker.ts");
    expect(service).toContain("ExecStart=/var/www/boomotech/node_modules/.bin/tsx scripts/process-notification-outbox.ts");
    expect(service).not.toContain("/usr/bin/env pnpm");
    expect(service).toContain("TimeoutStartSec=90");
    expect(service).toContain("NoNewPrivileges=true");
    expect(timer).toContain("OnUnitActiveSec=2min");
    expect(timer).toContain("Persistent=true");
    expect(installer).toContain("ENABLE_NOW=false");
    expect(installer).toContain("--enable-now) ENABLE_NOW=true");
    expect(installer).toContain('if [[ "$ENABLE_NOW" == true ]]');
    expect(installer).toContain("systemctl disable --now boomotech-notification-worker.timer");
    expect(installer).toContain("systemctl enable --now boomotech-notification-worker.timer");
    expect(installer).not.toContain("systemctl start boomotech-notification-worker.service");
    expect(installer).toContain("run_as_service_user node --version");
    expect(installer).toContain('TSX_BIN="${PROJECT_DIR}/node_modules/.bin/tsx"');
    expect(installer).toContain('run_as_service_user "$TSX_BIN" --version');
    expect(installer).toContain('exec \\"\\$3\\" scripts/check-notification-worker.ts');
    expect(installer).not.toContain("run_as_service_user pnpm --version");
    expect(logrotate).toContain("/var/log/boomotech-backup/*.log");
    expect(logrotate).toContain("/var/log/boomotech-monitor/*.log");
    expect(logrotate).toContain("/var/log/boomotech-deploy/*.log");
    expect(logrotate).toContain("compress");
    expect(logrotate).toContain("create 0640 boomotechhost boomotechhost");
  });

  it("provides a no-delivery notification configuration and schema preflight", () => {
    const packageJson = read("package.json");
    const preflight = read("scripts/check-notification-worker.ts");
    expect(packageJson).toContain('"notifications:check": "tsx scripts/check-notification-worker.ts"');
    expect(preflight.indexOf("validateNotificationWorkerEnvironment()")).toBeLessThan(preflight.indexOf('import("../src/db")'));
    expect(preflight).toContain("validateNotificationWorkerDatabaseEnvironment()");
    expect(preflight).toContain("from notification_outbox");
    expect(preflight).toContain("processing_started_at");
    expect(preflight).not.toContain("sendEmailWithResend");
  });

  it("keeps application maintenance dry-run by default and preserves business records", () => {
    const script = read("scripts/maintain-application-data.ts");
    expect(script).toContain('process.argv.includes("--apply")');
    for (const retained of ["booking_request", "booking_request_message", "booking_request_event"]) {
      expect(script).not.toMatch(new RegExp(`DELETE FROM ${retained}(?:\\s|$)`, "i"));
    }
  });
});
