import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("server security hardening", () => {
  it("keeps the audit script read-only and provides tri-state results", () => {
    const audit = read("scripts/server/security-audit.sh");
    expect(audit).toContain("if (( FAIL_COUNT > 0 )); then exit 2; fi");
    expect(audit).toContain("if (( WARNING_COUNT > 0 )); then exit 1; fi");
    expect(audit).toContain("exit 0");
    for (const mutation of ["apt-get install", "chmod ", "chown ", "ufw allow", "ufw delete", "systemctl restart", "systemctl reload", "sed -i", "cp -a"]) {
      expect(audit, `audit must not contain ${mutation}`).not.toContain(mutation);
    }
  });

  it("does not print or source application secrets during an audit", () => {
    const audit = read("scripts/server/security-audit.sh");
    expect(audit).not.toMatch(/source\s+["']?\$?\{?ENV_FILE/);
    expect(audit).not.toMatch(/cat\s+[^\n]*(\.env|EnvironmentFile)/);
    expect(audit).not.toMatch(/echo\s+[^\n]*\$(DATABASE_URL|OPENAI_API_KEY|RESEND_API_KEY|BETTER_AUTH_SECRET)/);
    expect(audit).toContain("gitleaks detect");
    expect(audit).toContain("--redact");
  });

  it("defaults the installer to audit-only operation", () => {
    const installer = read("scripts/server/install-security-hardening.sh");
    expect(installer).toContain("audit_only=true");
    expect(installer).toContain('if [[ "$audit_only" == true ]]');
    expect(installer).toContain('exec "${SCRIPT_DIR}/security-audit.sh"');
  });

  it("requires explicit lockout acknowledgement for sensitive changes", () => {
    const installer = read("scripts/server/install-security-hardening.sh");
    for (const flag of ["--apply-ssh", "--apply-firewall", "--apply-postgresql", "--yes-i-understand-lockout-risk", "--ssh-allow-cidr"]) {
      expect(installer).toContain(flag);
    }
    expect(installer).toContain('[[ "$lockout_acknowledged" == true ]]');
    expect(installer).toContain('[[ -n "$SSH_ALLOW_CIDR" ]] || fail');
    expect(installer).toContain('[[ -n "$app_home" && -s "$app_home/.ssh/authorized_keys" ]]');
    expect(installer).toContain("KEEP THIS SESSION OPEN");
    expect(installer).toContain("sshd -t");
    expect(installer).toContain("validate_cidr");
  });

  it("backs up system configuration and protects backup files", () => {
    const installer = read("scripts/server/install-security-hardening.sh");
    const backup = read("scripts/server/backup-boomotech.sh");
    expect(installer).toContain("backup_file");
    expect(installer).toContain("cp -a --");
    expect(installer).toContain("-m 0700");
    expect(installer).toContain("-exec chmod 0600");
    expect(backup).toContain('chmod 600 "$database_final"');
    expect(backup).toContain('chmod 600 "$config_final"');
  });

  it("passes the complete PostgreSQL URI explicitly for both connectivity checks", () => {
    const installer = read("scripts/server/install-security-hardening.sh");
    expect(installer.match(/psql "\$DATABASE_URL" -Atqc 'SELECT 1;'/g)).toHaveLength(2);
    expect(installer).not.toContain('PGDATABASE="$DATABASE_URL"');
    expect(read("docs/SERVER-SECURITY.md")).not.toContain('PGDATABASE="\\$DATABASE_URL"');
  });

  it("loads the trusted Fail2ban CIDR after the primary jail and verifies it", () => {
    const installer = read("scripts/server/install-security-hardening.sh");
    expect(installer).toContain("/etc/fail2ban/jail.d/zz-boomotech-ignore.local");
    expect(installer).toContain("/etc/fail2ban/jail.d/boomotech-ignore.local");
    expect(installer).toContain("fail2ban-client get sshd ignoreip");
    expect(installer).toContain('grep -Fq -- "$FAIL2BAN_IGNORE_CIDR"');
    expect(installer).toContain('backup_file "$legacy_ignore_override"');
    expect(installer).toContain('backup_file "$ignore_override"');
  });

  it("audits private services for wildcard exposure", () => {
    const audit = read("scripts/server/security-audit.sh");
    for (const expected of ["3000", "5432", "listen_addresses", "0\\.0\\.0\\.0/0", "::/0", "trust", "scram-sha-256"]) {
      expect(audit).toContain(expected);
    }
    expect(audit).toContain("Service is listening on a wildcard interface");
    expect(audit).toContain("UFW unexpected public rules");
    expect(audit).toContain("XRDP/RDP is listening on a wildcard interface");
    expect(audit).toMatch(/3389.*\\\(v6\\\).*ALLOW IN.*Anywhere/);
    expect(audit).toMatch(/3000\|5432.*\\\(v6\\\).*ALLOW IN.*Anywhere/);
    expect(audit).toMatch(/22\|OpenSSH.*\\\(v6\\\).*ALLOW IN.*Anywhere/);
    const installer = read("scripts/server/install-security-hardening.sh");
    expect(installer).toContain('([[:space:]]+\\(v6\\))?[[:space:]]+ALLOW IN[[:space:]]+Anywhere');
  });

  it("handles safe symlinks and alternate approved time services without false failures", () => {
    const audit = read("scripts/server/security-audit.sh");
    expect(audit).toContain("! -type l");
    expect(audit).toContain("systemctl is-active --quiet chrony");
    expect(audit).toContain("systemctl is-active --quiet chronyd");
    expect(audit).toContain("high_confidence_secret_files");
    expect(audit).toContain("postgres_secret_files");
  });

  it("adds security state to the daily monitoring snapshot", () => {
    const monitor = read("scripts/server/boomotech-monitor.sh");
    for (const expected of ["Security posture", "UFW is active", "fail2ban-client status sshd", "unattended-upgrades", "/var/run/reboot-required", "security-related package updates", "wildcard interface"]) {
      expect(monitor).toContain(expected);
    }
  });

  it("ships conservative reviewed templates", () => {
    expect(read("scripts/server/security/sshd-boomotech.conf.example")).toContain("PasswordAuthentication no");
    expect(read("scripts/server/security/fail2ban-boomotech.local")).toContain("banaction = ufw");
    expect(read("scripts/server/security/postgresql-boomotech.conf.example")).toContain("listen_addresses = 'localhost'");
    const activeHba = read("scripts/server/security/pg_hba-boomotech.conf.example")
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .join("\n");
    expect(activeHba).not.toContain("0.0.0.0/0");
    expect(read("scripts/server/security/boomotech-hardening.conf.example")).toContain("NoNewPrivileges=true");
  });
});
