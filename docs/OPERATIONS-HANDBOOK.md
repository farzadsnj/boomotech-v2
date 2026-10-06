# BoomoTech Project Operations Handbook

Last updated: 5 October 2026

## Purpose

This handbook records how the BoomoTech website has been planned, built, tested and prepared for deployment. It is written for a person with little or no experience who needs to run the project locally, understand the main systems, continue development safely, or prepare the first production release.

This is a living document. Update it after every meaningful infrastructure, deployment, security, database or operating-process change.

## 1. Read this first

BoomoTech V2 is a Next.js website for practical IT support, cloud, cybersecurity, networking, automation, web services, consultation requests, educational content and a curated product catalogue.

The repository is:

```text
https://github.com/farzadsnj/boomotech-v2
```

The planned public domain is:

```text
https://boomotech.com.au
```

The website includes database-backed verified customer accounts, password recovery, booking-request storage and an authorised customer-admin request conversation. A booking is a request, not a confirmed appointment. Shop products are examples, not purchasable stock. Checkout, payments and support-ticket attachments are not ready.

Never put passwords, API keys, database credentials, private keys or customer information into GitHub, screenshots, this handbook or chat messages.

## 2. Current project status

### Completed and tested

- Modern responsive marketing website with the BoomoTech logo and brand colours.
- Sticky navigation, mobile navigation, page-entry motion, section reveals and a back-to-top button.
- Homepage, services, solutions, support, resources, about, contact, booking and quote-related content.
- Service and solution visuals with accessible alternative text.
- Blog index, article template and three initial service-related articles.
- Product catalogue, search, categories, horizontal product rows and product-detail pages.
- Floating service chatbot with deterministic service matching and links to relevant pages.
- Shared booking form available on the booking page and inside the chatbot.
- PostgreSQL booking storage with public references such as `BT-...`.
- Optional booking notification delivery through Resend. A notification failure does not delete the booking.
- Customer registration and email/password login.
- Customer dashboard showing bookings linked to the authenticated user ID.
- Administrator username login and role-protected dashboard.
- Administrator dashboard listing registered customers and booking requests.
- Single-use, expiring customer email verification with a replaceable Resend adapter.
- Single-use, expiring password reset with branded Resend email and session revocation.
- Customer request editing and withdrawal before processing starts.
- Stored customer-admin request conversations, status, priority and audit history.
- Administrator filters, pagination and dedicated request response pages.
- Administrator-only internal request notes that never enter customer projections.
- Better Auth database sessions, HTTP-only cookies, Argon2id password hashing and server-side role checks.
- PostgreSQL-backed authentication and production booking rate limits.
- Drizzle database migrations.
- Unit, integration, accessibility, responsive and browser tests.
- GitHub Actions checks for migrations, linting, type checking, tests, build and browser testing.

### Infrastructure completed or confirmed

- Dell server selected for self-hosting.
- Ubuntu Server 24.04 LTS selected as the server operating system.
- Server designed for headless operation.
- Local network DHCP reservation created for the server.
- Ubuntu user `boomotechhost` created for server administration.
- OpenSSH installed and enabled.
- UFW firewall enabled with SSH allowed.
- Windows Ed25519 SSH key login tested successfully.
- SSH hardening configuration prepared with root login and password login disabled after key testing.
- PostgreSQL local development environment defined through Docker Compose.
- Node.js 22 and pnpm 11.19.0 selected for production.
- Application deployment directory confirmed as `/var/www/boomotech`.
- Application service confirmed as `boomotech.service`.
- Nginx reverse proxy confirmed for `127.0.0.1:3000`.
- Cloudflare DNS and Cloudflare Tunnel confirmed for the public route through local Nginx port 80.

### In progress or not yet production-approved

- Merge the backend feature pull request into `main` after owner review.
- Complete the first production deployment on the Dell server.
- Verify `boomotech.com.au`, HTTPS, Nginx, Cloudflare Tunnel and `boomotech.service` together after each deployment.
- Configure production PostgreSQL credentials, TLS, backup and restore procedures.
- Configure a verified Resend sender domain and booking destination.
- Approve privacy, terms, cancellation, retention and deletion policies.
- Add administrator password-change and recovery procedures.
- Extend audit logging beyond requests and add production monitoring.
- Replace every sample product, price and availability statement with verified data.
- Build cart, checkout, payment, shipping, stock and fulfilment only after business rules are approved.
- Build structured support tickets and attachments only after security and retention requirements are approved.
- Enable search-engine indexing only after the domain, policies, content and business details are approved.

## 3. Technology overview

| Area | Technology | Purpose |
|---|---|---|
| Application | Next.js 16 App Router | Pages, server rendering, API routes and metadata |
| Interface | React 19 and TypeScript | Components and strict application logic |
| Styling | Tailwind CSS and project CSS | Responsive layout, design tokens and interaction styles |
| Package manager | pnpm 11.19.0 | Dependency and script management |
| Runtime | Node.js 22 | Local development and production runtime |
| Database | PostgreSQL 17 | Accounts, sessions, bookings, outbox and rate limits |
| ORM and migrations | Drizzle ORM and Drizzle Kit | Typed queries and versioned schema changes |
| Authentication | Better Auth | Registration, login, sessions, username and roles |
| Password hashing | Argon2id | Secure credential hashing |
| Validation | Zod | Client and server input validation |
| Email | Resend adapter | Authentication email and optional booking-request notifications |
| Unit tests | Vitest | Content, auth, booking and utility tests |
| Browser tests | Playwright and Axe | End-to-end, responsive and accessibility checks |
| Local services | Docker Compose | Local PostgreSQL container |
| Source control | Git and GitHub | Version history, branches, pull requests and CI |
| Server | Ubuntu Server 24.04 LTS | Planned self-hosted production environment |

## 4. Repository map

```text
boomotech-v2/
|-- AGENTS.md                 Project rules for Codex and contributors
|-- README.md                 Quick project setup and overview
|-- docs/                     Product, design, architecture and operations documents
|-- drizzle/                  Versioned PostgreSQL migrations
|-- public/                   Logo, product and page visual assets
|-- scripts/                  Database preparation and admin seed scripts
|-- src/app/                  Next.js routes, APIs and global layout
|-- src/components/           Shared visual components
|-- src/content/              Typed services, products, blog and page content
|-- src/db/                   Drizzle connection and schema
|-- src/features/booking/     Booking form, validation, storage and notification
|-- src/features/chat/        Chatbot interface and deterministic service matching
|-- src/lib/auth/             Better Auth, permissions and password hashing
|-- src/styles/               Feature-specific styles
|-- tests/e2e/                Playwright browser tests
|-- docker-compose.yml        Local PostgreSQL service
|-- drizzle.config.ts         Database migration configuration
|-- package.json              Commands and dependency versions
|-- .env.example              Safe environment-variable template
```

Read these files before changing architecture, product scope or branding:

1. `AGENTS.md`
2. `docs/BRAND.md`
3. `docs/SITE-STRUCTURE.md`
4. `docs/DESIGN-SYSTEM.md`
5. `docs/CONTENT.md`
6. `docs/SEO.md`
7. `docs/ROADMAP.md`
8. `docs/ARCHITECTURE.md`
9. This handbook

## 5. One-time Windows workstation setup

### 5.1 Install required software

Install:

- Git for Windows
- Visual Studio Code
- Node.js 22 LTS
- Docker Desktop with WSL 2 support
- A modern browser such as Chrome or Edge

Confirm the installations in a new PowerShell terminal:

```powershell
git --version
node --version
npm.cmd --version
docker version
```

### 5.2 Install pnpm

The project pins pnpm 11.19.0. First try Corepack:

```powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm --version
```

If PowerShell blocks the `npm.ps1` script, use the Windows command shim:

```powershell
npm.cmd install --global pnpm@11.19.0
pnpm.cmd --version
```

Using `npm.cmd` or `pnpm.cmd` avoids changing the machine-wide execution policy. If a temporary policy adjustment is required, apply it only to the current PowerShell process and follow the organisation's security rules.

### 5.3 Clone the project

```powershell
cd C:\Users\YOUR-NAME\Documents\Codex
git clone https://github.com/farzadsnj/boomotech-v2.git
cd boomotech-v2
code .
```

If the repository already exists, do not clone another copy. Open its folder in VS Code.

## 6. Branch and update workflow

The production branch is `main`. Significant work should happen on a feature branch and be merged through a pull request after checks pass.

The current backend milestone is on:

```text
feat/backend-auth-bookings
```

Update that branch on a workstation:

```powershell
git fetch origin
git switch feat/backend-auth-bookings
git pull --ff-only origin feat/backend-auth-bookings
pnpm install --frozen-lockfile
```

After the pull request is merged, update `main`:

```powershell
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
```

Before changing files, always check:

```powershell
git status
git branch --show-current
```

Do not use destructive commands such as `git reset --hard` unless the exact consequences are understood and any valuable work is backed up.

### Safe feature-branch example

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/short-description
```

After making and testing changes:

```powershell
git status
git add path\to\changed-file
git commit -m "feat: describe the change"
git push -u origin feat/short-description
```

Open a GitHub pull request, review the changed files, wait for all checks to pass, and merge only after approval.

## 7. Local environment configuration

Create a local environment file from the safe example:

```powershell
Copy-Item .env.example .env.local
```

Use the following local-development structure:

```env
SITE_URL=http://localhost:3000
SITE_INDEXING_ENABLED=false

DATABASE_URL=postgres://boomotech:boomotech@localhost:5433/boomotech
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-private-random-value-at-least-32-characters
AUTH_FROM_EMAIL=BoomoTech <verified-local-test-sender@example.test>
EMAIL_VERIFICATION_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=60

BOOKING_NOTIFICATION_EMAIL=
BOOKING_FROM_EMAIL=
RESEND_API_KEY=

BOOKING_RATE_LIMIT_REST_URL=
BOOKING_RATE_LIMIT_REST_TOKEN=
BOOKING_TRUST_PROXY=false

ADMIN_USERNAME=farzadsnj
ADMIN_EMAIL=replace-with-the-approved-admin-email
ADMIN_TEMP_PASSWORD=replace-temporarily-when-seeding-admin
```

Generate a random authentication secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the output into `BETTER_AUTH_SECRET`. Never reuse the example text.

`.env.local` is private and must remain untracked. Verify it is ignored:

```powershell
git status --short
```

The file should not appear as a file waiting to be committed.

## 8. Start PostgreSQL locally

Start Docker Desktop and wait until the Docker engine reports that it is running.

From the project directory:

```powershell
docker compose up -d postgres
docker compose ps
```

The PostgreSQL container maps the database to loopback-only port `5433`. This avoids conflict with a PostgreSQL installation using the default port `5432` and prevents the development database from listening on external interfaces.

Apply all committed database migrations:

```powershell
pnpm db:migrate
```

Start the application:

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000
```

Stop the development server with `Ctrl+C`.

Stop the database container without deleting its data:

```powershell
docker compose stop postgres
```

Start it again later:

```powershell
docker compose start postgres
```

Do not run `docker compose down -v` unless the local database is intentionally being erased. The `-v` option deletes the database volume.

## 9. Database migrations

Database structure is defined in `src/db/schema.ts`. Migration files live under `drizzle/` and must be committed.

After an approved schema change:

```powershell
pnpm db:generate
```

Review the generated SQL before applying it. Then run:

```powershell
pnpm db:migrate
```

Rules:

- Never edit production data manually without an approved backup and change plan.
- Never point local tests at production.
- Never delete an already-applied migration.
- Use a new migration for every schema change.
- Back up production before applying migrations.
- Run migrations before starting application code that depends on them.

## 10. Create or update the administrator

The approved initial administrator username is:

```text
farzadsnj
```

Set temporary values in `.env.local`:

```env
ADMIN_USERNAME=farzadsnj
ADMIN_EMAIL=approved-admin-email@example.com
ADMIN_TEMP_PASSWORD=Choose-A-Private-Strong-Password
```

The temporary password must have at least 16 characters with uppercase letters, lowercase letters and a number.

Make sure PostgreSQL is running and migrations are applied, then run:

```powershell
pnpm admin:seed
```

Expected result:

```text
Administrator account created or updated. Remove ADMIN_TEMP_PASSWORD from .env.local now.
```

Remove `ADMIN_TEMP_PASSWORD` from `.env.local` immediately. The stored password is hashed; removing the environment value does not remove the account. Previously used Better Auth secrets, Resend keys and temporary administrator passwords must be rotated externally and must not be reused.

Sign in at:

```text
http://localhost:3000/admin/login
```

Running the seed command again updates the administrator and invalidates previous admin sessions. Never hard-code an administrator password in source code.

## 11. Account behaviour

### Customer registration

1. The visitor opens `/register`.
2. The form validates name, email, password and confirmation.
3. Better Auth creates the account with role `user`.
4. Argon2id hashes the password.
5. The account remains signed out and unverified.
6. The customer is redirected to `/check-email` and receives a single-use verification link when email delivery is configured.
7. Opening the valid link verifies the account, creates the session and redirects the customer to `/dashboard`.

### Customer login

1. Registration creates an unverified account and sends an expiring, single-use link through the authentication email adapter.
2. The customer opens the link, which consumes its hashed database grant before Better Auth marks the email verified.
3. The customer opens `/login` and signs in with email and password.
4. Only verified customers are redirected to `/dashboard`.
5. Invalid credentials and resend requests use generic language that does not reveal whether an email exists.

Existing development accounts are marked verified by migration `0002` to prevent an upgrade lockout. To test a fresh unverified account, register it after applying the migration. Do not manually update production verification state without an approved identity-recovery procedure.

### Administrator login

1. The administrator opens `/admin/login`.
2. They sign in with username and password.
3. The server verifies the session and `admin` role.
4. The administrator is redirected to `/admin`.
5. A normal customer attempting `/admin` is redirected safely.

The interface never provides an admin-role field during public registration. Hiding a link is not security; protected pages verify the session and role on the server.

### Password recovery

1. The customer opens `/forgot-password` and enters their email.
2. The response remains generic whether or not an account exists.
3. Better Auth stores an expiring reset record and the server-only adapter sends the branded Resend message.
4. The email link validates the token before redirecting to `/reset-password`.
5. A successful reset consumes the token, stores a new Argon2id hash and revokes existing sessions.
6. Invalid, expired and reused links show a safe option to request another link.

Password-reset requests are rate-limited. Tokens and API keys must never be logged or sent to analytics.

## 12. Booking and chatbot workflow

The chatbot does not currently send visitor messages to an external AI model. It matches approved service terms locally and links to canonical service pages. This reduces privacy and hallucination risks.

The chatbot and `/booking` use the same booking form. The form collects only the required fields:

- name;
- email;
- phone;
- requested service;
- message;
- consent acknowledgement.

The server process is:

1. Validate origin and request size.
2. Parse and validate the fields with the shared Zod schema.
3. Check the honeypot spam field.
4. Apply rate limiting.
5. Read the authenticated session if one exists.
6. Store the booking and notification-outbox record in one transaction.
7. Link it by immutable user ID only when a customer is authenticated.
8. Generate a public `BT-...` reference.
9. Attempt notification delivery if Resend is configured.
10. Record notification success or failure separately.

Guest requests remain unlinked. The system must never attach a guest request to an account merely because the email addresses match.

The customer dashboard shows only requests linked to that customer's immutable ID. It includes the full original description and chronological messages. A customer can edit or withdraw only while a request is unread and `NEW`; the server applies this rule atomically. Customer replies are permitted for `IN_PROGRESS` and `AWAITING_USER` requests. Resolved and withdrawn requests remain read-only.

The admin dashboard shows all booking requests with server-side status, priority, service and customer/reference filters. Opening a detail page does not lock the request. `Start processing` or the first administrator reply sets the read fields and locks customer editing. The allowed status transitions are:

```text
NEW -> IN_PROGRESS | RESOLVED
IN_PROGRESS -> AWAITING_USER | RESOLVED
AWAITING_USER -> IN_PROGRESS | RESOLVED
RESOLVED -> IN_PROGRESS
WITHDRAWN -> terminal
```

Priorities are `HIGH`, `MEDIUM` and `LOW`; new and migrated requests default to `MEDIUM`. Priority is an internal ordering aid and is not an SLA. Administrators can store private internal notes; those notes are excluded from all customer queries and responses. Every edit, withdrawal, read lock, reply, status change, priority change and internal-note update writes an audit event. A stored request remains a request rather than a confirmed booking.

Operational terminology maps to the established database values: `AWAITING_USER` means waiting for the customer, `RESOLVED` means completed, and `WITHDRAWN` means customer-cancelled before processing. Do not introduce a second set of status values.

### Customer verification email configuration

Configure these server-only values with a Resend sender that has been verified for authentication email:

```env
AUTH_FROM_EMAIL=BoomoTech <noreply@send.boomotech.com.au>
RESEND_API_KEY=re_replace_with_real_key
EMAIL_VERIFICATION_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=60
```

`AUTH_FROM_EMAIL` is logically separate from `BOOKING_FROM_EMAIL`. The same Resend API key may be used, but sender permissions and templates remain isolated in code. Never configure `AUTH_EMAIL_CAPTURE_PATH` in production; that variable exists only for automated tests. Confirm signup, verification, forgot-password, reset, expiry, reuse rejection, resend cooldown, session revocation and dashboard blocking before launch.

## 13. Booking email configuration

Database storage works without email delivery. For real notifications, create and verify a Resend account and sender domain, then set server-only values:

```env
BOOKING_NOTIFICATION_EMAIL=approved-destination@example.com
BOOKING_FROM_EMAIL=BoomoTech <noreply@send.boomotech.com.au>
RESEND_API_KEY=re_replace_with_real_key
```

Never prefix a public browser variable such as `NEXT_PUBLIC_` to the API key.

Test that:

- the database record exists;
- the user receives a reference;
- the admin dashboard shows the request;
- the email arrives;
- failed notification state is visible and can be followed up manually.

## 14. Add or edit website content

### Services

Service records are in:

```text
src/content/services.ts
```

Add the local image under `public/visuals/services/`, then update the typed service record. Include a unique slug, accurate description, visual path and meaningful alternative text. Update chatbot matching terms only when needed.

### Solutions

Solution records are in:

```text
src/content/solutions.ts
```

Use verified customer situations and outcomes. Do not claim regulated-industry capability without evidence and approved wording.

### Blog posts

Blog records are in:

```text
src/content/blog.ts
```

Add a unique slug, metadata, hero image, alternative text, structured sections, related service and related articles. Set `isPublished: true` only after review. Published records automatically create article pages and sitemap entries.

### Products

Product records are in:

```text
src/content/products.ts
```

Before making a real product public, verify:

- supplier and model;
- description and images;
- AUD price and GST treatment;
- stock and lead time;
- compatibility;
- warranty;
- shipping and returns;
- installation or service scope.

The current catalogue is advisory. It has no cart, payment, order, shipping or inventory reservation.

## 15. Test every change

Run the standard checks:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run browser tests when PostgreSQL and the required test environment are available:

```powershell
pnpm test:e2e
```

Check production dependencies:

```powershell
pnpm audit --prod
```

Manual checks should include:

- 320 px and 390 px mobile widths;
- tablet portrait;
- 1280 px desktop;
- keyboard-only navigation;
- visible focus indicators;
- reduced-motion mode;
- registration, login and logout;
- customer and admin route protection;
- booking from `/booking` and chatbot;
- admin booking visibility;
- service, blog and product links;
- validation, empty, success and error states.

Do not merge a change when required checks fail.

## 16. Confirmed server access setup

The production candidate is a Dell computer running Ubuntu Server 24.04 LTS. It is intended to run without a permanently attached monitor.

The confirmed administration pattern is SSH key access from trusted computers. Record the current private LAN address, router reservation and hardware details in a private infrastructure inventory, not in the public repository.

Useful Ubuntu checks:

```bash
hostname
hostname -I
ip address
ip route
sudo systemctl status ssh
sudo ufw status verbose
```

Typical initial packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y openssh-server ufw git curl
sudo systemctl enable --now ssh
sudo ufw allow OpenSSH
sudo ufw enable
```

Connect from Windows:

```powershell
ssh boomotechhost@SERVER-LAN-IP
```

Create an Ed25519 key on a new authorised Windows computer:

```powershell
ssh-keygen -t ed25519 -C "boomotech-admin-device"
```

Add the public key to the server only after verifying the device owner. Keep the private key on the source computer and never copy it into the repository.

### SSH hardening

Use a drop-in file such as:

```bash
sudo nano /etc/ssh/sshd_config.d/99-boomotech-hardening.conf
```

Configuration:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
```

Validate before restarting:

```bash
sudo sshd -t
```

Keep the existing SSH session open. Restart SSH and test a new session in a second terminal:

```bash
sudo systemctl restart ssh
```

Do not close the first session until key login works in the second session. This prevents accidental lockout.

### Graphical access

Graphical remote access is optional and is not required for website hosting. SSH should remain the main administration method. Cockpit can provide a browser-based administration view. XRDP with XFCE has also been explored, but its final headless reliability and firewall scope must be verified before this handbook marks it production-ready.

Never expose RDP port 3389 directly to the public internet. Restrict graphical access to the trusted LAN or a private VPN such as Tailscale.

## 17. Draft first-production deployment runbook

This section is a draft for the first deployment. Complete and verify it during the actual launch, then replace draft values with the confirmed architecture.

### 17.1 Prepare the server

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates nginx
```

Install Node.js 22 LTS and pnpm 11.19.0 using the official supported method. Verify:

```bash
node --version
pnpm --version
git --version
```

### 17.2 Prepare PostgreSQL

Install PostgreSQL from the approved Ubuntu repository and keep it bound to the private server:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres createuser --pwprompt boomotech_app
sudo -u postgres createdb --owner=boomotech_app boomotech
sudo ss -ltnp | grep 5432
```

Use a unique password from the production secret store. The listening-address check must show loopback or another explicitly approved private interface. Do not open PostgreSQL port 5432 in UFW, Nginx, Cloudflare or the router.

### 17.3 Obtain the application

Use a dedicated application directory owned by the deployment user:

```bash
sudo mkdir -p /var/www/boomotech
sudo chown boomotechhost:boomotechhost /var/www/boomotech
cd /var/www/boomotech
git clone https://github.com/farzadsnj/boomotech-v2.git .
git switch main
pnpm install --frozen-lockfile
```

If the repository becomes private, use a read-only deploy key rather than a personal password or broad personal token.

### 17.4 Production environment

Create the production environment through an access-controlled server file or secret manager. Minimum values include:

```env
SITE_URL=https://boomotech.com.au
SITE_INDEXING_ENABLED=false
DATABASE_URL='postgresql://PRODUCTION_USER:PRIVATE_PASSWORD@DATABASE_HOST:5432/boomotech'
BETTER_AUTH_URL=https://boomotech.com.au
BETTER_AUTH_SECRET=PRIVATE_RANDOM_VALUE_AT_LEAST_32_CHARACTERS
RESEND_API_KEY=PRIVATE_ROTATED_RESEND_KEY
AUTH_FROM_EMAIL='BoomoTech <noreply@send.boomotech.com.au>'
EMAIL_VERIFICATION_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=60
BOOKING_NOTIFICATION_EMAIL=APPROVED_PRIVATE_DESTINATION
BOOKING_FROM_EMAIL='BoomoTech <noreply@send.boomotech.com.au>'
BOOKING_TRUST_PROXY=true
```

Set `BOOKING_TRUST_PROXY=true` only after confirming that Nginx overwrites forwarded client-address headers. Replace the previously used Better Auth secret, Resend API key and administrator password; treat all earlier values as compromised. Verify `send.boomotech.com.au` in Resend before using the sender.

Store the values in untracked `.env.production`. Quote values that contain spaces or shell-sensitive characters. Protect the file:

```bash
chmod 600 .env.production
```

Do not include `ADMIN_TEMP_PASSWORD` in the steady-state production environment. `.gitignore` excludes `.env.production`; confirm it never appears in `git status`.

### 17.5 Database, administrator and build

Back up the production database before every migration after launch.

```bash
cd /var/www/boomotech
set -a
. ./.env.production
set +a
pnpm prod:check
pnpm db:migrate
```

Create the administrator with a temporary strong password in a separate, ignored bootstrap file. Edit the file directly so the password does not enter shell history:

```bash
install -m 600 /dev/null .env.admin-bootstrap
nano .env.admin-bootstrap
set -a
. ./.env.admin-bootstrap
set +a
NODE_ENV=production pnpm admin:seed
```

The bootstrap file must contain `ADMIN_USERNAME`, `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD`. After the seed succeeds, remove those values from the process and disk immediately, then validate and build with the steady-state environment:

```bash
unset ADMIN_USERNAME ADMIN_EMAIL ADMIN_TEMP_PASSWORD
shred -u .env.admin-bootstrap
pnpm prod:check
pnpm build
```

### 17.6 Application process

The confirmed service is `boomotech.service`. It must:

- run as a non-root user;
- start automatically after reboot;
- restart safely after failure;
- bind only to the intended local interface/port;
- load secrets without printing them;
- write bounded logs;
- expose a health check to monitoring.

The service should start the production application on loopback port 3000 from `/var/www/boomotech`. The application command is:

```bash
pnpm start --hostname 127.0.0.1 --port 3000
```

After the build:

```bash
sudo systemctl restart boomotech.service
sudo systemctl status boomotech.service --no-pager
sudo journalctl -u boomotech.service -n 100 --no-pager
```

### 17.7 Domain, proxy and HTTPS

The public path will be:

```text
Visitor -> boomotech.com.au -> HTTPS proxy or Cloudflare Tunnel -> local Next.js service
```

The confirmed request path is Cloudflare DNS and Tunnel to Nginx on local port 80, then Nginx to Next.js on `127.0.0.1:3000`. During launch, verify:

- final DNS provider and records;
- Cloudflare Tunnel reaches only Nginx on local port 80;
- certificate ownership and renewal;
- Nginx or tunnel configuration path;
- trusted proxy settings;
- firewall rules;
- origin port;
- rollback process.

Keep `SITE_INDEXING_ENABLED=false` during technical testing. Enable it only after content, policies, metadata, sitemap, redirects and domain canonicalisation pass launch review.

## 18. Production update procedure

After the initial production deployment is documented and backed up, use this controlled update procedure in exact order:

```bash
cd /var/www/boomotech
set -a
. ./.env.production
set +a
sudo install -d -m 700 -o boomotechhost -g boomotechhost /var/backups/boomotech
pg_dump --format=custom --file="/var/backups/boomotech/boomotech-$(date +%F-%H%M%S).dump" "$DATABASE_URL"
git status
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm prod:check
pnpm db:migrate
pnpm build
sudo systemctl restart boomotech.service
sudo systemctl status boomotech.service --no-pager
curl --fail --silent --show-error http://127.0.0.1:3000/ > /dev/null
curl --fail --silent --show-error https://boomotech.com.au/ > /dev/null
```

Then restart the confirmed application service and verify:

- service status;
- homepage and health response;
- customer login;
- admin login;
- booking submission and database record;
- error logs;
- database connectivity;
- HTTPS and canonical domain.

Do not deploy directly from an unreviewed feature branch. Do not run a migration without a current backup and rollback understanding.

## 19. Backup and recovery requirements

Production is not ready until backups are automatic and restoration has been tested.

Back up:

- PostgreSQL database;
- production environment configuration through a secure secret backup process;
- proxy or tunnel configuration;
- systemd or process-manager configuration;
- uploaded files if a future feature stores them;
- a record of deployed Git commit SHAs.

Example logical PostgreSQL backup pattern:

```bash
pg_dump --format=custom --file=boomotech-YYYY-MM-DD.dump "$DATABASE_URL"
```

Do not place the backup in the public web directory or Git repository. Encrypt it, restrict access, copy it to a separate device or service and define retention. Test restoration into a separate non-production database.

## 20. Security and privacy rules

- Use least privilege for server, database, GitHub and email accounts.
- Keep SSH private keys and environment files private.
- Do not accept passwords or secrets through support or booking forms.
- Do not log booking messages or personal contact details unnecessarily.
- Do not send personal booking content to analytics or AI providers.
- Apply operating-system and dependency security updates regularly.
- Restrict PostgreSQL to required hosts only.
- Use TLS for production database connections where supported.
- Rate-limit public authentication and booking endpoints.
- Review administrator and server access regularly.
- Create a data retention and deletion policy before public collection.
- Create an incident-response contact and procedure.
- Never expose RDP, PostgreSQL or the Next.js development server directly to the internet.

## 21. Troubleshooting guide

### `pnpm` is not recognised

Use:

```powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
```

Or:

```powershell
npm.cmd install --global pnpm@11.19.0
```

Close and reopen the terminal, then check `pnpm --version`.

### PowerShell says scripts are disabled

Use `npm.cmd` and `pnpm.cmd` instead of the `.ps1` shims:

```powershell
npm.cmd --version
pnpm.cmd install
```

Avoid weakening the computer's permanent execution policy just to run package-manager commands.

### Docker cannot connect to `dockerDesktopLinuxEngine`

Docker Desktop is installed but its Linux engine is not running.

1. Open Docker Desktop.
2. Wait until it reports that the engine is running.
3. Run `docker version` and confirm both Client and Server sections appear.
4. Retry `docker compose up -d postgres`.

If Docker is stuck:

```powershell
wsl --shutdown
```

Then reopen Docker Desktop.

### `pnpm db:migrate` exits with code 1

Check the database first:

```powershell
docker compose ps
docker compose logs postgres
```

Confirm `DATABASE_URL` points to local port `5433`, then run:

```powershell
docker compose up -d postgres
pnpm db:migrate
```

### Admin seed reports `@next/env` has no export named `loadEnvConfig`

This compatibility issue was fixed on `feat/backend-auth-bookings` on 4 October 2026. Update the branch:

```powershell
git fetch origin
git switch feat/backend-auth-bookings
git pull --ff-only origin feat/backend-auth-bookings
pnpm install --frozen-lockfile
pnpm admin:seed
```

### Admin seed says variables are missing

Add `ADMIN_USERNAME`, `ADMIN_EMAIL` and a compliant `ADMIN_TEMP_PASSWORD` to `.env.local`. Make sure the file is in the project root and named exactly `.env.local`.

### Port 3000 is already in use

Stop the older development process with `Ctrl+C`. To identify it:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

Do not terminate an unknown process until it has been identified.

### Login works but a protected page redirects incorrectly

Check:

- `BETTER_AUTH_URL` exactly matches the browser origin;
- `BETTER_AUTH_SECRET` exists and is at least 32 characters;
- PostgreSQL is running;
- migrations are current;
- browser cookies are enabled;
- the admin seed completed successfully;
- the application was restarted after environment changes.

### Booking stores but email is not sent

This is expected when Resend variables are missing or delivery fails. Check the admin dashboard notification status and server logs without printing personal data. Verify the sender domain and API key.

### SSH access fails after hardening

Use the still-open original SSH session or local server console. Run:

```bash
sudo sshd -t
sudo systemctl status ssh
sudo journalctl -u ssh --since "30 minutes ago"
ls -ld ~/.ssh
ls -l ~/.ssh/authorized_keys
```

Typical permissions are `700` for `.ssh` and `600` for `authorized_keys`.

## 22. Routine operating checklist

### Before starting work

- Read open issues and the active pull request.
- Run `git status` and confirm the branch.
- Pull with `--ff-only`.
- Start Docker Desktop and PostgreSQL if account or booking work is required.
- Confirm `.env.local` exists without exposing it.

### Before committing

- Review `git diff`.
- Confirm no secret or personal data is included.
- Run lint, type checking and relevant tests.
- Check mobile and keyboard behaviour for interface changes.
- Update documentation for changed commands, variables or operations.

### Before merging

- Pull request scope is clear.
- GitHub Actions is green.
- Database migrations have been reviewed.
- Security and privacy impact has been considered.
- Screenshots or manual evidence are included when useful.
- No placeholder claim is presented as real.

### Before production deployment

- Approved backup exists.
- Environment values are production values, not local examples.
- Domain and HTTPS plan is confirmed.
- Database access is restricted.
- Required migrations are understood.
- Admin and booking workflows have test cases.
- Rollback steps and previous Git SHA are recorded.
- Monitoring and operational contact are available.

## 23. Handover checklist for a new person

A new maintainer should be able to answer these questions before working independently:

1. Which branch is production and which branch contains active work?
2. How are secrets kept out of Git?
3. How is PostgreSQL started locally?
4. How are migrations generated, reviewed and applied?
5. How is the admin account created without hard-coding a password?
6. What is the difference between a booking request and a confirmed appointment?
7. Which shop data is still sample data?
8. Where are services, products and blog posts edited?
9. Which tests must pass before merging?
10. How is SSH access tested before password login is disabled?
11. Where are production backups stored and how was restore tested?
12. How is the application restarted and rolled back in production?

If any answer is unclear, stop and review this handbook, `README.md`, `AGENTS.md` and the architecture documents before making production changes.

## 24. Milestone history

### Foundation

- Created product, brand, content, SEO, design-system, site-structure and roadmap documents.
- Established the Next.js, TypeScript, responsive layout, content model, metadata and test foundation.
- Added the BoomoTech logo, brand palette and core marketing routes.

### Production-readiness and interface work

- Added origin validation, safer forms, browser coverage and accessible motion.
- Added modern fonts, sticky navigation, homepage pointer interaction, back-to-top control and page visuals.
- Improved services, solutions, support FAQ, resources, blog, shop and about content.

### Chatbot, booking and blog

- Added the floating assistant, service matching and progressive booking flow.
- Added booking validation, spam protection, rate limiting and optional email notification.
- Added blog templates and three initial articles.

### Shop and accounts

- Added the sample product catalogue, search, categories and detail pages.
- Added Better Auth, PostgreSQL sessions, customer registration/login and administrator role checks.
- Added customer and administrator dashboards.

### Backend persistence

- Added booking and notification-outbox database tables.
- Added transactional booking storage and public references.
- Linked authenticated bookings by user ID.
- Listed customer bookings in the customer dashboard and all requests in the admin dashboard.
- Added PostgreSQL production booking rate limiting.
- Fixed retry-safe browser authentication tests.
- Fixed Next.js 16 environment loading in the administrator seed script.

### Verified accounts and request communication

- Required verified email before customer sign-in and dashboard access.
- Added hashed, expiring, single-use verification grants and safe resend behaviour.
- Added request status, priority, read, resolution, withdrawal and concurrency fields.
- Added stored request messages and audit events.
- Added atomic customer edit and withdrawal rules.
- Added administrator filtering, explicit processing locks, replies, status transitions and priorities.
- Added responsive customer and administrator request interfaces.

### Server preparation

- Selected Ubuntu Server 24.04 LTS on the Dell server.
- Configured local network reservation, SSH, UFW and Ed25519 key access.
- Prepared SSH hardening and headless management.
- Planned Docker, PostgreSQL, Node.js, Nginx or Cloudflare Tunnel, backups, monitoring and automatic startup for the first production deployment.

## 25. Next milestone

The next milestone is production operational approval and the first controlled release at `boomotech.com.au`.

The launch session must update this handbook with:

- actual server hostname and private inventory location;
- deployment directory;
- production service name and restart command;
- final database location and backup schedule;
- Nginx or Cloudflare Tunnel configuration;
- DNS records and HTTPS method;
- monitoring and log locations;
- tested restore and rollback procedure;
- deployment date and Git commit SHA;
- launch verification results;
- approved indexing state.

Only after the first stable production release should the project expand into confirmed appointments, structured support tickets, real commerce, richer customer portal features or AI-assisted workflows.
