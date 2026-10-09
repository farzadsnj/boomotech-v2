# BoomoTech Production Server Security

Last updated: 8 October 2026

This runbook covers the Ubuntu host `BoomoTechHost`, application account `boomotechhost`, checkout `/var/www/boomotech`, and service `boomotech.service`. It prepares reviewed commands; it does not prove that the live host is hardened. Run the read-only audit on the host and review every finding before applying a change.

## Architecture and trust boundaries

```text
Internet -> Cloudflare -> Cloudflare Tunnel -> loopback Nginx
         -> 127.0.0.1:3000 Next.js -> loopback PostgreSQL:5432
```

- Cloudflare Tunnel is the intended public entry point. UFW normally needs no public rules for 80, 443, 3000 or 5432.
- Nginx proxies only to `127.0.0.1:3000`. Trust `CF-Connecting-IP` only when the request arrives from the local tunnel connection.
- Next.js starts with `next start --hostname 127.0.0.1 --port 3000`.
- PostgreSQL must listen only on loopback and use SCRAM for TCP password authentication.
- `boomotech.service` runs as `boomotechhost`, never root. Root owns system configuration and server backups.

The repository preserves the current Argon2id credentials, server-side sessions, role and origin checks, rate limits, verified-email flow, single-use password-reset tokens and `no-store` headers. Administrator MFA is a future application change. Evaluate TOTP or WebAuthn/passkeys separately.

## Safety rules

1. Use provider console access before changing SSH or UFW.
2. Keep the current SSH session open and prove a second key-authenticated session works.
3. Apply SSH, firewall and PostgreSQL changes separately.
4. Read the backup path printed by the installer before continuing.
5. Never paste secrets into commands that will be retained in shell history.
6. Do not apply these templates directly without comparing them to the effective host configuration.

## Read-only audit

From the reviewed production checkout:

```bash
cd /var/www/boomotech
sudo BOOMOTECH_SSH_ALLOW_CIDR='OWNER_APPROVED_CIDR' \
  ./scripts/server/security-audit.sh
printf 'audit exit: %s\n' "$?"
```

Exit `0` means no critical finding or warning, `1` means one or more warnings, and `2` means at least one critical finding. The audit reads effective UFW, socket, SSH, PostgreSQL, file, service, Nginx, Cloudflare, header, time, AppArmor, update and reboot state. It never sources the production environment or prints credential values.

The verification wrapper runs the same full check:

```bash
sudo BOOMOTECH_SSH_ALLOW_CIDR='OWNER_APPROVED_CIDR' \
  ./scripts/server/verify-security-hardening.sh
```

Review listening services independently:

```bash
sudo ss -lntup
sudo ufw status verbose
sudo ufw status numbered
```

## Installer modes

Running the installer with no mutation flag is read-only:

```bash
sudo ./scripts/server/install-security-hardening.sh --audit-only
```

Run each approved low-risk mode separately:

```bash
sudo ./scripts/server/install-security-hardening.sh --install-base
sudo ./scripts/server/install-security-hardening.sh --apply-permissions
sudo ./scripts/server/install-security-hardening.sh --install-fail2ban
sudo ./scripts/server/install-security-hardening.sh --enable-unattended-upgrades
sudo ./scripts/server/install-security-hardening.sh --install-systemd-drop-in
```

The installer creates timestamped copies under `/var/backups/boomotech/security-config/` before replacing a system file. It does not run a distribution upgrade. Its final audit may return `1` or `2` while other separately approved controls remain unapplied.

## UFW policy

Expected policy:

- deny incoming by default;
- allow outgoing by default;
- allow TCP 22 only from the owner-approved management CIDR;
- no public inbound 80, 443, 3000, 3389 or 5432 rule;
- no other public `ALLOW IN` rule unless the owner has reviewed and approved its exact source and purpose;
- IPv6 filtering enabled with the same intent.

**LOCKOUT RISK — confirm console access and keep the current SSH session open.** Validate the exact management CIDR with the network owner, then run:

```bash
sudo ./scripts/server/install-security-hardening.sh \
  --apply-firewall \
  --ssh-allow-cidr 'OWNER_APPROVED_CIDR' \
  --yes-i-understand-lockout-risk
```

Immediately open a second SSH session. If it fails, use the still-open session or provider console. Emergency rollback exposes services and must be temporary:

```bash
sudo ufw disable
sudo cp -a /var/backups/boomotech/security-config/TIMESTAMP/etc/ufw/. /etc/ufw/
sudo cp -a /var/backups/boomotech/security-config/TIMESTAMP/etc/default/ufw /etc/default/ufw
sudo ufw --force enable
sudo ufw status verbose
```

Do not enable Cockpit, XRDP or another public administrative port without a separate approved source restriction. The audit fails if XRDP/RDP listens on a wildcard address or UFW allows TCP 3389 from `Anywhere`. If XRDP is intentionally retained, bind or firewall it to an owner-approved management CIDR and supply that CIDR to the audit for review. The audit reports other unexpected public `ALLOW IN` rules for operator review; it never deletes them.

## SSH key-only access

The reviewed drop-in is `scripts/server/security/sshd-boomotech.conf.example`. `AllowTcpForwarding` and `AuthenticationMethods` remain unset because administration requirements are not confirmed.

Before applying it:

```bash
sudo stat -c '%U:%a %n' /home/boomotechhost/.ssh \
  /home/boomotechhost/.ssh/authorized_keys
sudo test -s /home/boomotechhost/.ssh/authorized_keys
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|permitemptypasswords|x11forwarding) '
sudo sshd -t
```

**LOCKOUT RISK — only continue with working key access, provider console access, and the current session kept open.**

```bash
sudo ./scripts/server/install-security-hardening.sh \
  --apply-ssh \
  --yes-i-understand-lockout-risk
```

The installer validates with `sshd -t` and reloads SSH. Test a second session before disconnecting. Roll back from the open session or console:

```bash
sudo cp -a /var/backups/boomotech/security-config/TIMESTAMP/etc/ssh/sshd_config.d/99-boomotech-hardening.conf \
  /etc/ssh/sshd_config.d/99-boomotech-hardening.conf
# If the file did not exist before, remove the installed drop-in instead.
sudo sshd -t
sudo systemctl reload ssh
```

## Fail2ban

The SSH jail uses the systemd backend, UFW action, five failures in ten minutes, a one-hour first ban and bounded incremental bans. Loopback is always ignored. An additional trusted CIDR is optional and must be supplied by the operator. The override is written to `/etc/fail2ban/jail.d/zz-boomotech-ignore.local`, which sorts after `/etc/fail2ban/jail.d/boomotech.local`. The installer backs up both this destination and the legacy `/etc/fail2ban/jail.d/boomotech-ignore.local`, migrates only when the exact approved CIDR is supplied, and verifies that the effective `sshd` jail contains the requested CIDR without printing banned address lists.

```bash
sudo ./scripts/server/install-security-hardening.sh \
  --install-fail2ban \
  --fail2ban-ignore-cidr 'OWNER_APPROVED_CIDR'
sudo fail2ban-client -t
sudo systemctl status fail2ban --no-pager
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Do not add an Nginx jail that bans local tunnel addresses. Client enforcement through Cloudflare would require a separately approved Cloudflare API design.

Rollback:

```bash
backup_root=/var/backups/boomotech/security-config/TIMESTAMP
for name in boomotech.local zz-boomotech-ignore.local boomotech-ignore.local; do
  if sudo test -e "$backup_root/etc/fail2ban/jail.d/$name"; then
    sudo cp -a "$backup_root/etc/fail2ban/jail.d/$name" "/etc/fail2ban/jail.d/$name"
  else
    sudo rm -f "/etc/fail2ban/jail.d/$name"
  fi
done
sudo fail2ban-client -t
sudo systemctl reload fail2ban
```

## Unattended security updates

The templates use Ubuntu’s packaged distro variables and explicitly disable automatic reboot. Install and verify:

```bash
sudo ./scripts/server/install-security-hardening.sh --enable-unattended-upgrades
sudo unattended-upgrade --dry-run --debug
systemctl status unattended-upgrades --no-pager
systemctl list-timers apt-daily.timer apt-daily-upgrade.timer --all
test ! -e /var/run/reboot-required || echo 'Approved reboot required'
```

Schedule required reboots manually after a backup and maintenance notice. To roll back, restore the timestamped `/etc/apt/apt.conf.d/20auto-upgrades` and `52unattended-upgrades-boomotech` files, or remove files that did not previously exist.

## PostgreSQL isolation

Audit without printing the application database URL:

```bash
sudo -u postgres psql -Atc 'SHOW listen_addresses;'
sudo -u postgres psql -Atc 'SHOW port;'
sudo -u postgres psql -Atc 'SHOW password_encryption;'
sudo -u postgres psql -Atc 'SHOW hba_file;'
sudo ss -lntup | grep ':5432'
```

Review `postgresql-boomotech.conf.example` and `pg_hba-boomotech.conf.example`. Do not overwrite distribution files. Remove unrestricted `0.0.0.0/0`, `::/0` and unjustified `trust` rules by hand while preserving local peer administration.

The optional installer mode backs up active files, rejects unsafe HBA rules, proves application access, uses `ALTER SYSTEM`, validates `pg_file_settings`, reloads PostgreSQL, and proves application access again. Both application checks pass the complete connection URI explicitly as `psql "$DATABASE_URL"`; a PostgreSQL URI must not be assigned to `PGDATABASE`. The mode stages the loopback listen setting; a later restart is still required for that setting.

```bash
PG_CONFIG_DIR="$(sudo -u postgres psql -Atc "SELECT setting FROM pg_settings WHERE name='config_file';" | xargs dirname)"
sudo ./scripts/server/install-security-hardening.sh \
  --apply-postgresql \
  --postgres-config-dir "$PG_CONFIG_DIR" \
  --yes-i-understand-lockout-risk
```

**SERVICE INTERRUPTION RISK — in an approved maintenance window only:**

```bash
sudo systemctl restart postgresql
sudo -u postgres psql -Atc 'SHOW listen_addresses;'
sudo -u postgres psql -Atc 'SHOW password_encryption;'
sudo -u boomotechhost bash -lc "cd /var/www/boomotech && set -a && source .env.production && set +a && psql \"\$DATABASE_URL\" -Atqc 'SELECT 1;'"
sudo systemctl restart boomotech.service
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null
curl --fail --silent --show-error https://boomotech.com.au/ >/dev/null
```

Rollback using the printed backup path, then restart PostgreSQL and retest:

```bash
sudo cp -a /var/backups/boomotech/security-config/TIMESTAMP/ABSOLUTE/PATH/postgresql.auto.conf ABSOLUTE/PATH/postgresql.auto.conf
sudo cp -a /var/backups/boomotech/security-config/TIMESTAMP/ABSOLUTE/PATH/pg_hba.conf ABSOLUTE/PATH/pg_hba.conf
sudo systemctl restart postgresql
```

## File permissions

Expected minimums:

| Path | Owner | Mode/constraint |
|---|---|---|
| `/var/www/boomotech` | `boomotechhost` | manageable by application user; no world-writable files |
| `.env.production` | `boomotechhost` | `0600` |
| `~boomotechhost/.ssh` | `boomotechhost` | `0700` |
| `authorized_keys` | `boomotechhost` | `0600` |
| `/var/backups/boomotech` | root | `0700` or reviewed `0750` |
| backup files | root | `0600` |
| Nginx/systemd configuration | root | not world-writable |
| Cloudflare JSON/PEM credentials | root | `0600` |

Use `--apply-permissions` for these narrow paths. It does not recursively make the repository root-owned or set ordinary source files to `0600`. Securely remove a completed bootstrap file:

```bash
sudo -u boomotechhost rm -f /home/boomotechhost/.env.admin-bootstrap
```

The installer records the previous owner/group/mode values in the printed backup directory as `permissions.before.txt`. If an approved path stops working, review that manifest from the console and restore only the affected path with explicit `chown` and `chmod`; do not execute the manifest as a script.

## Nginx and Cloudflare Tunnel

Compare the active site with `nginx-boomotech-origin.conf.example`. Confirm the tunnel reaches loopback Nginx before changing its listeners.

```bash
sudo systemctl status cloudflared nginx --no-pager
sudo nginx -t
sudo grep -R -E 'proxy_pass|set_real_ip_from|real_ip_header|listen ' /etc/nginx
sudo stat -c '%U:%a %n' /etc/cloudflared/*.json /etc/cloudflared/*.pem 2>/dev/null
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1/ >/dev/null
curl --fail --silent --show-error https://boomotech.com.au/ >/dev/null
```

Do not print or copy tunnel credential content. Restore the prior Nginx site from a timestamped backup and run `nginx -t` before reloading if a manual origin change fails.

## systemd service hardening

Inspect first:

```bash
sudo systemctl cat boomotech.service
sudo systemctl show boomotech.service -p User -p Group
sudo systemd-analyze security boomotech.service
```

The drop-in protects the host while keeping the Next.js cache writable. It runs the project-local Next.js binary directly with `/usr/bin/node` instead of starting through pnpm/Corepack, so `ProtectHome=true` does not require writable package-manager state under the service user's home. `MemoryDenyWriteExecute` is intentionally absent because Node/V8 compatibility has not been proven.

```bash
sudo ./scripts/server/install-security-hardening.sh --install-systemd-drop-in
# During an approved maintenance window:
sudo systemctl daemon-reload
sudo systemctl restart boomotech.service
sudo systemctl status boomotech.service --no-pager
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null
```

Rollback:

```bash
sudo rm -f /etc/systemd/system/boomotech.service.d/hardening.conf
# Or restore the prior drop-in from the printed timestamped backup.
sudo systemctl daemon-reload
sudo systemctl restart boomotech.service
```

## HTTP headers and CSP

Production responses add `Strict-Transport-Security: max-age=86400` without `includeSubDomains` or `preload`. After every BoomoTech subdomain has been verified HTTPS-only over a sustained period, consider `max-age=31536000` in a separate review.

The existing CSP, Referrer Policy, Permissions Policy, content-type protection, frame protection, hidden `X-Powered-By`, and sensitive-route `no-store` headers remain. The CSP’s `unsafe-inline` allowance is a documented residual risk. A nonce design would force request-time nonce propagation through the App Router and every relevant style/script path; it should be implemented only with browser regression coverage. Removing it in this pass could break Next.js rendering, so the working policy was not weakened or partially rewritten.

```bash
curl -sSI https://boomotech.com.au/ | grep -Ei 'strict-transport-security|content-security-policy|referrer-policy|permissions-policy|x-content-type-options|x-frame-options'
```

## Security monitoring

`boomotech-monitor.sh` records UFW, Fail2ban/sshd jail, unattended-upgrades, reboot marker, security update count, wildcard listener count and loopback state for ports 3000 and 5432. It does not log ban lists, addresses, environment values, credentials or customer data.

```bash
sudo ./scripts/server/boomotech-monitor.sh
sudo tail -n 120 /var/log/boomotech-monitor/"$(date -u +%F)".log
```

## Dependency and source scanning

The dedicated GitHub workflow runs a production dependency audit, ShellCheck, Gitleaks and CodeQL. Actions are pinned to reviewed commits. Dependabot checks npm/pnpm and GitHub Actions weekly. These checks are separate from the deployment script so an external advisory database outage does not block an emergency, operator-approved deployment.

Local commands:

```bash
pnpm audit --prod
gitleaks detect --source . --redact
shellcheck scripts/server/*.sh scripts/deploy-production.sh
```

## Secret rotation runbook

Never store a replacement value in Git, documentation, screenshots, tickets or shell history.

- **PostgreSQL application password:** take and validate a backup; use the interactive PostgreSQL `\password` command for the application role; update `.env.production` through the protected editor/secret process; restart the app; prove login, booking and admin workflows; then revoke the old credential if rotation used a new role.
- **BETTER_AUTH_SECRET:** generate it through the approved secret manager, update `.env.production`, restart the app and test authentication. This invalidates all existing sessions, so schedule and communicate the forced sign-in.
- **Resend API key:** create a restricted replacement in Resend, update the protected environment, restart and test verification/reset/booking delivery, then revoke the old key.
- **OpenAI key:** create a restricted replacement, update the protected environment, restart and test the AI fallback and service guidance, then revoke the old key.
- **Cloudflare Tunnel credential:** treat compromise as an incident; create/rotate through the Cloudflare dashboard, replace the root-owned `0600` credential file, restart cloudflared, verify public and local origin health, then revoke the old credential.
- **Administrator password:** use the authenticated password reset/change process. Do not recreate a bootstrap environment file unless the approved recovery process requires it; delete it immediately afterward.
- **SSH keys:** add the new public key, check owner/mode, prove a second session, then remove the old key and review Fail2ban/UFW state.

## Backups and disaster recovery

**The current backup is on the same server. THIS IS NOT A COMPLETE DISASTER-RECOVERY BACKUP.** A disk loss, host compromise or destructive operator error can remove both production and its backups.

Select an encrypted off-site destination in a separate owner decision: another secured server, encrypted object storage, or encrypted offline media. Define key custody, retention, access logging, deletion and quarterly restore testing before implementation. Do not copy `.env.production` or customer data to an unapproved vendor.

## Incident-response first steps

1. Preserve access through provider console; do not destroy evidence or rotate everything blindly.
2. If active compromise is likely, restrict Cloudflare/Tunnel and network access using an owner-approved containment plan.
3. Record UTC time, symptoms, affected host/service and commands run. Do not copy credentials or customer data into the record.
4. Take protected disk/database evidence only if safe; avoid overwriting the last known-good backup.
5. Review `journalctl`, Nginx, cloudflared, PostgreSQL, authentication and application logs with least access.
6. Rotate only credentials in the affected trust boundary, then invalidate sessions where required.
7. Restore from a validated clean point, run this audit, verify critical user journeys, and document customer/legal notification decisions with the owner.

## Troubleshooting

- An audit `WARN` means an operator decision or optional facility needs review. A `FAIL` means the stated production baseline is absent.
- If the app stops after systemd hardening, inspect `journalctl -u boomotech.service -n 100 --no-pager`, restore/remove the drop-in, daemon-reload and restart.
- If PostgreSQL rejects the app, restore the printed PostgreSQL backup, restart PostgreSQL, and retest the protected `DATABASE_URL` without printing it.
- If public health fails while local Nginx and Next.js pass, inspect cloudflared, Cloudflare DNS/ingress and the tunnel dashboard.
- If `gitleaks` reports a value, do not paste it into an issue. Revoke the credential if real, remove it from current files and use a reviewed history-remediation plan.
