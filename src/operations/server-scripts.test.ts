import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("server operations scripts", () => {
  it("creates and validates database and configuration backups with retention tiers", () => {
    const script = read("scripts/server/backup-boomotech.sh");
    expect(script).toContain("pg_dump --format=custom");
    expect(script).toContain("pg_restore --list");
    expect(script).toContain("tar --list --gzip");
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/daily" 7');
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/weekly" 4');
    expect(script).toContain('prune_directory "$BACKUP_ROOT/$kind/monthly" 3');
  });

  it("restores only into a generated restore-test database", () => {
    const script = read("scripts/server/restore-boomotech.sh");
    expect(script).toContain("boomotech_restore_test_");
    expect(script).toContain("pg_restore --exit-on-error");
    expect(script).toContain("dropdb --if-exists");
    expect(script).not.toContain("boomotech_production");
  });

  it("monitors network, resources, services, PostgreSQL, Nginx and HTTP health", () => {
    const script = read("scripts/server/boomotech-monitor.sh");
    for (const required of ["vnstat", "/proc/loadavg", "free -h", "df -Pk", "boomotech.service", "postgresql.service", "curl --fail", "access.log", "error.log"]) {
      expect(script).toContain(required);
    }
    expect(script).toContain("BOOMOTECH_DISK_WARNING_PERCENT:-80");
    expect(script).toContain("BOOMOTECH_DISK_CRITICAL_PERCENT:-90");
  });

  it("keeps the deployment safety steps in the required order", () => {
    const script = read("scripts/deploy-production.sh");
    const ordered = [
      "git status --porcelain",
      "backup-boomotech.sh",
      "git fetch --prune origin",
      "git pull --ff-only origin main",
      "pnpm install --frozen-lockfile",
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

  it("installs persistent nightly backup and daily monitoring timers", () => {
    const backupTimer = read("scripts/server/systemd/boomotech-backup.timer");
    const monitorTimer = read("scripts/server/systemd/boomotech-monitor.timer");
    expect(backupTimer).toContain("OnCalendar=*-*-* 02:00:00 Australia/Brisbane");
    expect(monitorTimer).toContain("OnCalendar=*-*-* 06:15:00 Australia/Brisbane");
    expect(backupTimer).toContain("Persistent=true");
    expect(monitorTimer).toContain("Persistent=true");
  });
});
