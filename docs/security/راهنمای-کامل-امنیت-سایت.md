# راهنمای کامل امنیت سایت

> کیت امنیت برای سایت و اپی که با هوش مصنوعی (مثل Claude) ساختی.
> این یه فایل واحده: بدی به Claude، خودش پنج تا فایل امنیتی رو تو پروژه‌ت می‌سازه، پروژه رو باهاشون چک می‌کنه و مشکلا رو درست می‌کنه.

فهرست:

1. خلاصهٔ کامل (برای تو)
2. نقشهٔ راه (قدم‌به‌قدم، با پرامپت آماده برای هر قدم)
3. پرامپت آماده (یه پرامپت که همه‌چیز رو راه می‌ندازه)
4. متن کامل پنج فایل: `security.md`، `auth.md`، `data.md`، `hack.md`، `checklist.md`
5. یادداشت ایمنی

---

## ۱. خلاصهٔ کامل

### چرا سایتی که با هوش مصنوعی ساختی ممکنه زود هک بشه؟

ساده‌ش اینه: هوش مصنوعی کدی می‌نویسه که **کار کنه**. نه کدی که **امن باشه**.

تو می‌گی «یه صفحهٔ لاگین بساز»، اونم می‌سازه و لاگین کار می‌کنه. ولی اینکه بعد از چند بار رمز اشتباه حساب قفل بشه، یا کلید API تو کد فرانت‌اند نیفته، یا کاربر A نتونه اطلاعات کاربر B رو ببینه، رو معمولاً نمی‌گه. چون تو نخواستی و تا کار می‌کنه، همه راضی‌ان.

نتیجه؟ سایتی که از بیرون عالی به نظر میاد، ولی چند تا در باز توش مونده. خبر خوب اینه که این درها معمولاً همون چند تا مورد تکراری‌ان، و می‌شه با یه چک‌لیست درستشون کرد. این کیت دقیقاً همینه.

### این پنج تا فایل چی‌کار می‌کنن؟

| فایل | یه‌خطی |
|------|--------|
| `security.md` | قانون‌های پایه: کلید API و رمزها هیچ‌وقت عمومی نشن، رمز کاربرا درست ذخیره بشن، سایت فقط با HTTPS باشه. |
| `auth.md` | ورود و خروج: همهٔ لاگین و لاگ‌اوت‌ها چک بشن، بعد از چند بار رمز اشتباه حساب قفل بشه، بعد از خروج نشست حتماً بسته بشه. |
| `data.md` | اطلاعات مهم کاربر (شماره، ایمیل، اسم، کارت بانکی...): چی رو نگیر، چطور نگهش دار، و کِی پاکش کن. |
| `hack.md` | هوش مصنوعی راه‌های حملهٔ رایج رو می‌گرده، هر چی پیدا کرد با شاهد گزارش می‌ده و کمکت می‌کنه درستش کنی تا کاربرای واقعی‌ت آسیب نبینن — ولی تضمین نمی‌ده همه‌چی پیدا بشه. |
| `checklist.md` | همهٔ بالایی‌ها یه‌جا. قبل از هر انتشار جدید، AI یکی‌یکی چکشون می‌کنه و می‌گه کدوم درسته و کدوم نه. |

### چطور استفاده کنم؟

فقط همین فایل رو به Claude بده و پرامپت بخش ۳ رو بفرست. بقیه‌ش با Claude. فقط یادت باشه:

- قبلش از پروژه‌ت نسخهٔ پشتیبان بگیر (قدم صفر پایین).
- Claude قبل از کارای ریسکی ازت می‌پرسه. جواب بده، عجله نکن.
- این یه بار انجام دادن نیست. هر بار که چیز مهمی اضافه کردی (پرداخت، لاگین، آپلود)، دوباره چک‌لیست رو اجرا کن.

---

## ۲. نقشهٔ راه

هر قدم یه پرامپت آماده داره. کپی کن و برای Claude Code (یا Cursor و...) بفرست، داخل پوشهٔ پروژه‌ت.

### قدم ۰ — پشتیبان بگیر / کامیت کن

قبل از هر تغییری، یه نقطهٔ برگشت بساز تا اگه یه جا خراب شد، برگردی.

```
قبل از هر کاری، وضعیت پروژه رو چک کن:
1. اگه git داره: `git status` رو نشون بده، هر تغییر ذخیره‌نشده رو commit کن (با اجازهٔ من)، و یه branch جدید به اسم `security-hardening` بساز.
2. اگه git نداره: بپرس می‌خوام `git init` بزنی یا یه کپی از پوشهٔ پروژه بگیری. هیچ فایل `.env` یا کلیدی رو commit نکن.
3. تا وقتی من تأیید نکردم، هیچ کد پروژه رو تغییر نده.
جوابت رو فارسی و ساده بده.
```

### قدم ۱ — پنج تا فایل رو بذار تو پروژه

مسیر پیشنهادی `docs/security/` هست (یا ریشهٔ پروژه، فرقی نداره). لازم نیست خودت دستی کپی کنی؛ Claude این کارو با پرامپت بخش ۳ می‌کنه. ولی اگه فقط می‌خوای فایل‌ها ساخته بشن:

```
پوشهٔ `docs/security/` رو بساز و پنج فایل `security.md`، `auth.md`، `data.md`، `hack.md` و `checklist.md` رو داخلش بذار.
متن دقیق هر فایل تو بخش ۴ همین فایل (`راهنمای-کامل-امنیت-سایت.md`) زیر عنوان اسم همون فایله، داخل بلوک کد. فقط محتوای داخل بلوک رو، بدون هیچ تغییری، تو فایل بریز.
بعد لیست فایل‌های ساخته‌شده رو نشون بده. هنوز هیچ کد پروژه رو تغییر نده.
```

### قدم ۲ — پرامپت آماده رو بفرست

پرامپت بخش ۳ رو کپی کن و بفرست. Claude فایل‌ها رو می‌سازه و پروژه رو به ترتیب باهاشون چک می‌کنه.

### قدم ۳ — به ترتیب درست کن: security ← auth ← data ← hack

ترتیب مهمه: اول پایه (کلیدها و رمزها)، بعد ورود و خروج، بعد داده‌ها، آخر سر گشتن دنبال حفره‌ها. هر مرحله رو جدا بفرست و تموم شدنش رو صبر کن.

پرامپت ۳-الف (security):

```
فایل `docs/security/security.md` رو کامل بخون و کل پروژه رو با قانون‌های S1 تا S17 چک کن.
اول فقط گزارش بده (جدول فارسی)، هنوز چیزی رو عوض نکن. بعد، مشکلات رو به ترتیب خطر یکی‌یکی درست کن.
قبل از کارای ریسکی (چرخوندن کلید، تغییر دیتابیس، پاک کردن تاریخچهٔ git) از من بپرس.
اگه کلیدی لو رفته بود، اولین کار اینه که بهم بگی تا خودم کلید رو تو سایت ارائه‌دهنده عوض کنم.
```

پرامپت ۳-ب (auth):

```
فایل `docs/security/auth.md` رو کامل بخون و لاگین، لاگ‌اوت، نشست‌ها، فراموشی رمز و دسترسی‌ها رو با قانون‌های A1 تا A17 چک کن.
مخصوصاً: قفل شدن حساب بعد از ۵ رمز اشتباه، بسته شدن نشست سمت سرور بعد از خروج، و تنظیمات کوکی.
۸ تا تست آخر فایل رو اجرا کن (فقط روی نسخهٔ محلی یا staging خودم) و نتیجه‌ش رو نشون بده. بعد از تأیید من درست کن.
```

پرامپت ۳-ج (data):

```
فایل `docs/security/data.md` رو کامل بخون. اول جدول `docs/security/data-inventory.md` رو با پیدا کردن همهٔ داده‌هایی که پروژه ذخیره می‌کنه پر کن.
بعد با قانون‌های D1 تا D16 چک کن: کارت بانکی، ماسک کردن تو لاگ، رمزنگاری، زمان پاک شدن داده‌ها، دکمهٔ حذف حساب، بکاپ.
مدت نگه‌داری هر داده رو پیشنهاد بده و از من بپرس. هیچ دادهٔ واقعی رو بدون اجازهٔ من پاک نکن.
```

پرامپت ۳-د (hack):

```
فایل `docs/security/hack.md` رو کامل بخون و مثل یه ممیز امنیتی کل پروژه رو بگرد و هر چیزی رو که نتونستی تأیید کنی صادقانه بنویس.
سطح حمله رو نقشه کن، دسته‌های رایج OWASP رو چک کن (به‌علاوهٔ بخش‌های اضافه‌ای که تو فایل هست)، یافته‌ها رو تو جدول `docs/security/findings.md` بنویس، اول Critical و High رو درست کن.
فقط روی پروژهٔ خودم و نسخهٔ محلی یا staging. هیچ سیستم دیگه‌ای رو تست نکن. قبل از تغییرات ریسکی ازم بپرس.
```

### قدم ۴ — قبل از هر انتشار، چک‌لیست رو اجرا کن

هر بار که می‌خوای نسخهٔ جدید بیاری بالا:

```
فایل `docs/security/checklist.md` رو کامل بخون و قبل از انتشار تک‌تک موردها رو چک کن.
برای هر مورد وضعیت ✅ یا ❌ یا ➖ بده و شاهد بیار (فایل، دستور، خروجی). چیزی که نتونستی تأیید کنی ❌ حساب کن.
اگه حتی یکی از موردهای BLOCKER ❌ بود، بنویس «منتشر نکن» و بگو چی باید درست بشه.
گزارش رو فارسی، تو جدول، بده و تو `docs/security/release-report-<تاریخ>.md` ذخیره کن.
```

---

## ۳. پرامپت آماده

این رو کپی کن و برای Claude بفرست. **همراه این فایل** (یعنی `راهنمای-کامل-امنیت-سایت.md` یا `SECURITY-KIT-GUIDE.md` رو بهش بده، یا تو پوشهٔ پروژه بذار).

```
تو یه مهندس امنیت دقیق و بااحتیاطی. فایل راهنمای امنیت (`راهنمای-کامل-امنیت-سایت.md`، یا `SECURITY-KIT-GUIDE.md`) رو از اول تا آخر بخون.

مرحلهٔ ۱ — ساخت فایل‌ها:
تو پروژهٔ من پوشهٔ `docs/security/` رو بساز و پنج فایل `security.md`، `auth.md`، `data.md`، `hack.md`، `checklist.md` رو با «دقیقاً» همون محتوایی که تو بخش ۴ همین راهنما (زیر عنوان هر فایل، داخل بلوک کد) هست بساز. هیچ چیزی رو کم، زیاد یا خلاصه نکن. لیست فایل‌های ساخته‌شده رو نشون بده.

مرحلهٔ ۲ — بررسی پروژه به ترتیب:
پروژه‌م رو به ترتیب با این فایل‌ها بررسی کن: security.md ← auth.md ← data.md ← hack.md. برای هر فایل، قانون‌ها رو یکی‌یکی چک کن و نتیجه رو با شاهد (فایل، خط، خروجی دستور) بنویس. هنوز چیزی رو تغییر نده.

مرحلهٔ ۳ — درست کردن:
بعد از گزارش، مشکل‌ها رو یکی‌یکی و به ترتیب خطر (Critical، High، Medium، Low) درست کن. هر تغییر کوچیک و جدا باشه. قبل از هر کار ریسکی (migration دیتابیس، پاک کردن داده، عوض کردن روند لاگین، آپدیت major پکیج‌ها، چرخوندن کلید واقعی، پاک کردن تاریخچهٔ git) از من بپرس و صبر کن جواب بدم. هیچ قابلیت امنیتی رو برای «درست شدن» خاموش نکن.

قانون‌های همیشگی:
- فقط روی پروژهٔ خودم و نسخهٔ محلی یا staging کار کن. به هیچ سیستم دیگه‌ای حمله یا اسکن نزن.
- مقدار واقعی هیچ کلید یا رمزی رو تو جواب نشون نده.
- هر چیزی که نتونستی تأیید کنی رو صادقانه «تأیید نشد» بنویس. هیچ‌وقت بدون شاهد ✅ نده.

گزارش:
همهٔ جواب‌هات فارسی و ساده باشه. برای هر فایل یه جدول با ستون‌های «قانون، وضعیت (✅/❌/➖)، شاهد، کار لازم» بده. آخرش بگو سه تا مهم‌ترین چیزی که باید بدونم چیه و چی منتظر تأیید منه.
```

---

## ۴. متن کامل پنج فایل

هر بلوک پایین دقیقاً همون محتوای فایل جداگانه‌ست. (بلوک‌ها با چهار بک‌تیک بسته شدن چون داخلشون کد هم هست.)

### security.md

````markdown
# security.md — Core security rules

> این فایل دستورالعمل پایهٔ امنیتیه برای دستیار هوش مصنوعی‌ت (Claude Code، Cursor و...). کلیدها و رمزها هیچ‌وقت لو نرن، رمز کاربرها درست ذخیره بشن، و چند اصل پایه (HTTPS، ورودی امن) رعایت بشن.
> بذارش تو پروژه و به AI بگو: «طبق این فایل کد جدید بنویس و کد فعلی رو هم چک کن.»

## Instructions for the AI assistant

You are a security-minded senior engineer working inside this project. Follow every rule below when writing NEW code and when REVIEWING existing code. If a rule cannot be followed, say so and explain the risk instead of silently skipping it. Ask before any change that could break production (DB migrations, auth flow rewrites, key rotation).

**Secret handling in your own output:** fully redact secret values everywhere (answers, reports, logs, commit messages), including prefixes or the first characters. Report only variable names, file locations, and finding IDs. Configure scanners and searches so they do not print matched values (e.g. `gitleaks ... --redact`, `git grep -l` for file names only).

How to read the rules: **MUST** = required, **NEVER** = forbidden. Every rule has an ID (S1, S2...) that `checklist.md` uses. Keep the IDs when you report.

## 1. Secrets and API keys (never public)

- **S1** MUST keep every secret (API keys, DB URLs/passwords, JWT/session secrets, webhook secrets, OAuth client secrets, SMTP passwords, private keys) out of source code, config files that are committed, comments, tests, screenshots, and logs. NEVER hardcode a secret as a string literal.
- **S2** MUST read secrets only from environment variables or a secret manager (platform env vars, Doppler, Vault, AWS/GCP Secrets Manager...). `.env`, `.env.*` (except `.env.example`) MUST be listed in `.gitignore` BEFORE the first commit. Provide `.env.example` with placeholder values only.
- **S3** NEVER put a secret in frontend code or a public env var. Anything prefixed `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, `EXPO_PUBLIC_`, `PUBLIC_` (Astro/SvelteKit) ends up in the browser bundle and is public. Keys meant to be public by design (Stripe publishable key, Supabase anon key, Firebase web config) are allowed ONLY if backend rules protect the data (RLS / security rules enabled and tested).
- **S4** MUST use separate keys per environment (dev / staging / production). Production keys MUST exist only in the production host's secret settings, not on developer laptops.
- **S5** MUST apply least privilege to every key: smallest scope, restricted by IP/domain/referrer when the provider supports it, and a spending/usage limit on paid APIs (OpenAI, Anthropic, Google Maps, SMS, etc.).
- **S6** Privileged calls, and any call that needs a confidential credential, MUST run on the BACKEND (the browser calls your own endpoint; it checks auth + rate limit, then calls the provider). Provider-supported PUBLIC browser SDKs (e.g. hosted payment fields, maps with a restricted key) are allowed, using only their public key with the provider's required restrictions (allowed domains, scopes, quotas).
- **S7** MUST add secret scanning: a pre-commit hook or CI step using `gitleaks` or `trufflehog`. Enable the Git host's secret scanning / push protection if available. Run it once on the full git history now.
- **S8** If a secret may have leaked (committed, pasted in chat, logged, in a screenshot), the order is: (1) REVOKE / ROTATE the key at the provider immediately; (2) check the provider's usage logs for abuse; (3) put the new key in env/secret manager; (4) remove the old value from every place it appeared (log system, chat, ticket, screenshot). ONLY if it was committed to Git: ask me for explicit approval, coordinate with collaborators, then rewrite history (`git filter-repo` or BFG) and force-push; clones and forks may still hold it. Treat the old key as compromised forever, even after cleanup.
- **S9** NEVER paste real secrets into AI chat prompts, issue trackers, or public gists. Use placeholders such as `YOUR_API_KEY`.
- **S10** The owner's own passwords (hosting, database, domain, GitHub, email, payment provider) MUST live in a password manager (Bitwarden, 1Password, KeePass...), never in notes apps, chat, or code. 2FA MUST be on for GitHub, hosting, domain registrar, email, and payment accounts.

```gitignore
.env
.env.*
!.env.example
*.pem
*.key
```

## 2. Storing users' passwords

- **S11** NEVER store passwords in plaintext, reversible encryption, MD5, SHA-1, or plain SHA-256. MUST use a slow password hash from a maintained library, in this order of preference:
  1. **Argon2id** (OWASP minimum: 19 MiB memory, 2 iterations, parallelism 1; or 46 MiB with 1 iteration);
  2. **scrypt** with `N=2^17` (131072), `r=8`, `p=1`;
  3. **PBKDF2-HMAC-SHA256** with at least 600,000 iterations, ONLY when FIPS-140 compliance is required;
  4. **bcrypt** only for LEGACY hashes (verify, then re-hash with the preferred algorithm on next login). bcrypt truncates input at 72 bytes: NEVER silently truncate a password.
  The library generates a unique salt per password. NEVER write your own hashing or crypto. Verify the ACTUAL stored parameters, not just the hash prefix.
- **S12** Password rules MUST follow NIST SP 800-63B (revision 4): minimum **15 characters when the password is the only factor**; minimum 8 only when MFA is enforced for the account. Allow at least 64 characters, all Unicode and spaces (count code points), allow paste and password managers, and NEVER truncate. NEVER force composition rules ("1 uppercase + 1 symbol") and NEVER force periodic changes; require a change only on evidence of compromise. MUST reject passwords found in a breached/common list (e.g. Have I Been Pwned "Pwned Passwords" range API with k-anonymity, or a local list). Show a strength hint, not a blocking checklist.
- **S13** Random values for tokens, session IDs, reset links, and API keys MUST come from a cryptographically secure generator (`crypto.randomBytes(32)`, Python `secrets.token_urlsafe(32)`, or the framework's built-in generator). NEVER use `Math.random()` or timestamps.

## 3. Transport and basic hygiene

- **S14** MUST serve everything over HTTPS only. Redirect HTTP to HTTPS (301) and send `Strict-Transport-Security`. Roll HSTS out in stages: start with a short `max-age` (e.g. 300) on staging, raise it to `max-age=31536000` only after confirming everything works. Add `includeSubDomains` or `preload` ONLY after an inventory shows that ALL subdomains (including internal tools and old services) already work over HTTPS, and I approve.
- **S15** MUST use parameterized queries / prepared statements or the ORM's safe API for ALL database access. NEVER build SQL/NoSQL queries or shell commands by string concatenation with user input.
- **S16** MUST validate input on the SERVER with schemas (`zod`, `pydantic`, `joi`...): type, length, format, allowed values. Client-side validation is only for user experience. For every write endpoint define an explicit **allowlist of writable fields** (DTO / schema per endpoint). Derive ownership (`userId`), roles, prices, and status on the server. NEVER bind the request body directly to a database model (mass assignment). Validation is not XSS protection: see context-specific output encoding in `hack.md` H5.
- **S17** Production config MUST have debug mode off, no default or demo credentials, and the app's DB user MUST have only the permissions it needs (never the DB superuser/admin).

## How to verify (examples, without printing secret values)

- `git grep -lEi "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}"` lists file names only; open each and review without quoting values.
- `gitleaks detect --redact --source . --log-opts="--all"` reports no findings.
- Search the built frontend (`dist/`, `.next/static/`) for each secret's value with `grep -rlF` (file names only): zero files.
- Inspect stored password hashes: the algorithm AND parameters match S11 (e.g. `$argon2id$v=19$m=19456,t=2,p=1$...`); report only the parameters, never full hashes.
- `curl -sI http://yourdomain` redirects to `https://`; `curl -sI https://yourdomain` shows `strict-transport-security`.

## How to report back to me (گزارش به من)

Answer in Persian, in simple words. Start with a 2-line summary (how many rules passed, how many failed). Then give ONE table with these columns, one row per rule S1–S17:

| # | قانون | وضعیت (✅ / ❌ / ➖ نامربوط) | شاهد (فایل:خط یا خروجی دستور، بدون مقدار رمز) | کار لازم |
|---|-------|------|------|------|

Then list the fixes you propose in order of danger, and wait for my "OK" before any risky change. Never show real secret values or prefixes in the report.

Reference: OWASP Cheat Sheets (Secrets Management, Password Storage, Transport Layer Security, HSTS, Mass Assignment), OWASP Top 10:2021, OWASP ASVS 5.0.0 (V11 Cryptography, V12 Secure Communication, V13 Configuration), NIST SP 800-63B rev. 4.
````

### auth.md

````markdown
# auth.md — Login, logout and sessions

> این فایل دستورالعمل ورود و خروج کاربره برای دستیار هوش مصنوعی‌ت. هر لاگین و لاگ‌اوت رو چک می‌کنه، بعد از چند بار رمز اشتباه پشت‌سرهم حساب رو قفل می‌کنه و بعد از خروج حتماً نشست (session) رو می‌بنده.
> بذارش تو پروژه و به AI بگو طبقش کد رو بنویس و چک کنه.

## Instructions for the AI assistant

Review and implement authentication following the rules below. Prefer the framework's or a well-maintained library's auth and session features (Auth.js, Supabase Auth, Clerk, Django/Rails/Laravel built-ins...) over custom code, and check that the library is still maintained. Do not invent your own crypto or session scheme. Password hashing and password policy are defined in `security.md` (S11, S12) and are not repeated here. Ask before changing an existing login flow that real users depend on. Never print real tokens, cookies, or secrets in reports.

How to read the rules: **MUST** = required, **NEVER** = forbidden, and every rule has an ID (A1, A2...) that `checklist.md` uses. Keep the IDs when you report.

## 1. Login: errors, throttling, lockout

- **A1** MUST return the SAME generic message for wrong email and wrong password: "Email or password is incorrect". Same HTTP status, same response shape, and similar response time (hash a dummy password when the user does not exist). The same applies to sign-up ("check your email") and password reset ("if this email exists, we sent a link"). Do not reveal whether an account exists.
- **A2** MUST rate-limit login, sign-up, password reset, OTP/2FA verification, and email-sending endpoints per IP AND per account/identifier (e.g. `express-rate-limit`, `slowapi`, Upstash Ratelimit, Cloudflare rules). Return `429` with `Retry-After`.
- **A3** MUST lock or slow down accounts after repeated failures. Default policy (adjust only with my approval): after **5 failed attempts within 15 minutes** → lock the account for **15 minutes**; repeated lockouts increase the delay (exponential backoff: 15 min, 30 min, 1 h, capped at 24 h). Store the counter and lock time SERVER-SIDE (DB/Redis), reset the counter after a successful login, and keep returning the generic message while locked (do not tell attackers "account locked"; tell the real owner by email). Provide an unlock path via password reset email. To reduce lockout abuse, also throttle per IP and consider CAPTCHA after 3 failures.
- **A4** MUST check new passwords at sign-up / change / reset against the policy in `security.md` S12 (NIST length rules + breached-password list).
- **A5** MUST log failed logins, lockouts, password changes, and resets (user id, time, IP, user agent). NEVER log the password itself or tokens. Notify the user by email on password change and on lockout.

## 2. Sessions and cookies

- **A6** Session cookies MUST be set with `HttpOnly`, `Secure`, and `SameSite=Lax` (use `Strict` when the app allows it). Prefer the `__Host-` prefix, which REQUIRES `Secure`, `Path=/`, and NO `Domain` attribute (a narrower path needs a different cookie name). Example: `Set-Cookie: __Host-sid=...; HttpOnly; Secure; SameSite=Lax; Path=/`.
- **A7** Session IDs MUST be random with at least 128 bits of entropy (CSPRNG), meaningless to the client, and validated against a SERVER-SIDE store (DB/Redis) on every request. NEVER store the session token or JWT in `localStorage`/`sessionStorage`. If JWTs are used: short-lived access token (5–15 min), refresh token in an `HttpOnly` cookie with rotation, and a server-side revocation check on every request. MUST verify the signature with the trusted issuer's keys (reject `alg: none`; pin allowed algorithms) AND check issuer, audience, expiry, `nbf` when present, and the intended token type. NEVER authorize from merely decoded claims, and NEVER accept an ID token as an API access token.
- **A8** MUST rotate (regenerate) the session ID on login and on any privilege change (e.g. user becomes admin, MFA completed). This prevents session fixation. Never accept a session ID from URL parameters.
- **A9** MUST enforce timeouts on the SERVER: idle timeout (default 30 min, shorter for admin/finance) and absolute timeout (default 12 h). "Remember me" is optional, uses a separate long-lived token (max 30 days) stored hashed in the DB, and sensitive actions still require fresh re-authentication with a method the user has enrolled (password, passkey, or the external provider for federated-only accounts).

## 3. Logout (the part people forget)

AI-generated apps very often "log out" by only deleting the cookie in the browser, while the session stays valid on the server. A stolen cookie then still works. Check this first.

- **A10** Logout MUST invalidate the session on the SERVER: delete the session row, revoke the refresh token and the remember-me token, and make already-issued access tokens stop working (per-request revocation check or a very short access-token lifetime plus denylist). Also clear the cookie (`Max-Age=0`, same attributes).
- **A11** Logout MUST be a `POST` WITH CSRF protection (see A16), never a plain `GET` link. After logout, using the OLD cookie / access token / refresh token / remember-me token on any protected route MUST return `401`, and the back button must not show private pages (`Cache-Control: no-store` on authenticated pages).
- **A12** MUST offer "log out of all devices". All sessions and tokens (access, refresh, remember-me) MUST also be invalidated after password change, password reset, account deletion, and account disablement (by admin or by the user).

## 4. Reset, verification, 2FA, authorization

- **A13** Password reset tokens MUST be random (≥128 bits), stored HASHED in the DB, **single-use**, expire in 15–60 minutes, and be invalidated when a newer one is requested. Email an HTTPS reset URL built from a configured trusted application origin (an env var), NEVER from an unchecked `Host` / `X-Forwarded-Host` header. Keep tokens out of logs and out of `Referer` (`Referrer-Policy: no-referrer` on the reset page). After a successful reset: invalidate all sessions, notify the user, and keep MFA enabled (reset must not remove MFA).
- **A14** MUST verify the email address at sign-up (single-use expiring link). When a user CHANGES their email: keep the new address pending until verified, require re-authentication, and notify the OLD address. Password-only accounts should confirm from both addresses or use a documented secure recovery procedure. Other sensitive actions (change password, delete account, payment details) MUST require re-authentication.
- **A15** MFA: available to every user, REQUIRED for admin accounts (for apps that handle payments or sensitive data, require it for all users). Prefer passkeys (WebAuthn) or TOTP apps; SMS only as a fallback. OTPs and recovery codes MUST be single-use (reject replay), OTPs short-lived, recovery codes shown once and stored hashed. Re-authenticate before adding, replacing, or removing a factor, and notify the user of every factor change. A passkey counts as MFA only when WebAuthn user verification is required and verified.
- **A16** Every protected route/API MUST check authentication AND authorization on the SERVER on every request (role + ownership of the object). Hiding a button in the UI is not protection. State-changing requests that rely on cookies, INCLUDING login and logout, MUST have CSRF protection: SameSite plus a CSRF token or an exact `Origin` check against a list of trusted origins (reject missing, `null`, or untrusted origins unless another valid CSRF defense passes).
- **A17** If the app uses "Sign in with Google/GitHub/..." MUST use a maintained library for that provider; authorization-code flow with PKCE (`S256`) where the provider supports it; validate `state` bound to the user's browser session; exact registered redirect URIs (no wildcards). **For OpenID Connect providers** (e.g. Google) also validate `nonce` and the ID token (signature, issuer, audience, expiry) and identify the user by `(iss, sub)`, never by email alone. **For plain OAuth providers without ID tokens** (e.g. GitHub OAuth apps) get the identity from the provider's user API with the access token and key the account on the provider's stable user ID. Never use an ID token as an access token. NEVER auto-merge accounts by matching email: linking an external login to an existing account requires the user to be signed in to (or re-authenticate on) BOTH.

## Tests the AI MUST run (or write) and show results for

1. Wrong password 5 times in a row → 6th attempt is blocked even with the correct password; works again after the lock period.
2. Login with a non-existent email vs. existing email + wrong password → identical response (body, status, ~timing).
3. Login → copy the cookie → logout → replay the old cookie on a protected API → `401`.
4. Session ID before login ≠ session ID after login.
5. Reset link used twice → second use fails; expired link fails.
6. Cookie flags visible in the response: `HttpOnly; Secure; SameSite`.
7. Change password → other devices' sessions stop working.
8. After logout, password reset, and account deletion/disablement: replay the old access token, refresh token, and remember-me token → all rejected.

Run these only against local/staging copies of MY app.

## How to report back to me (گزارش به من)

Answer in Persian, in simple words. Begin with a short summary, then ONE table for rules A1–A17 and the 8 tests:

| # | قانون یا تست | وضعیت (✅ / ❌ / ➖) | شاهد (فایل:خط، خروجی تست، curl، بدون توکن واقعی) | کار لازم |
|---|-------------|------|------|------|

Then list what you want to change, in order of danger. Ask me before touching the login flow that existing users use.

Reference: OWASP Cheat Sheets (Authentication, Session Management, Forgot Password, Password Storage, CSRF Prevention, Multifactor Authentication), OWASP ASVS 5.0.0 (V6 Authentication, V7 Session Management, V9 Self-contained Tokens, V10 OAuth and OIDC), NIST SP 800-63B rev. 4. Target level: ASVS Level 1 as the minimum for every project, Level 2 for apps handling payments or sensitive data.
````

### data.md

````markdown
# data.md — Users' important data and when to delete it

> این فایل دستورالعمل داده‌های مهم کاربره برای دستیار هوش مصنوعی‌ت: شماره تلفن، ایمیل، اسم، کارت بانکی و...
> می‌گه چی رو اصلاً نگیر، چی رو چطوری نگه دار، و کِی پاکش کن.

## Instructions for the AI assistant

Treat every piece of personal data as a liability: collect less, protect it, and delete it on schedule. Follow the rules below for new code and review existing code. Create and maintain `docs/security/data-inventory.md` (rule D1). When a retention period needs a legal or business decision, propose a default, mark it "needs owner decision", and ask me. Do not claim legal compliance (GDPR, local laws); only follow the technical practices here. Never print real personal data or secrets in reports; use masked examples.

How to read the rules: **MUST** = required, **NEVER** = forbidden. Every rule has an ID (D1, D2...) that `checklist.md` uses. Keep the IDs when you report.

## 1. Know what you store

- **D1** MUST create `docs/security/data-inventory.md` with one row per stored personal/sensitive field, found by reading the DB schema/models, forms, logs, analytics, and third-party integrations. Fill it in, do not leave it empty:

| Field | Why needed | Where stored (table/service) | Who can read | Encrypted? | Retention / delete when |
|-------|-----------|------------------------------|--------------|-----------|-------------------------|
| email | login, receipts | `users.email` | app, support | in transit + disk | until account deletion |
| phone | OTP login | `users.phone` | app | field-level | until account deletion |
| full name | invoice | `users.name` | app, support | disk | until account deletion |
| ... | ... | ... | ... | ... | ... |

- **D2** MUST apply data minimisation: if a field has no clear purpose, do not collect it. Make optional fields optional. Do not ask for national ID, date of birth, address, or location unless a feature truly needs it. Remove fields that nothing uses.
- **D3** Sensitive categories that need extra care: password hashes, phone, email, full name, address, national ID, bank card and payment data, location, IP address, health data, private messages, uploaded documents/photos, auth tokens.

## 2. Payment cards: never store them

- **D4** NEVER store the full card number (PAN), CVV/CVC, or PIN, not even encrypted, not in logs, not in "temporary" tables, and no inventory justification can allow it. Use the payment provider's hosted page or SDK (Stripe Checkout/Elements, or your gateway's redirect page) so card data never touches your server. Store only what the provider returns: customer id, payment/transaction id, token, brand, last 4 digits, and expiry if needed. If PAN/CVV/PIN is found stored anywhere, it is a failure: remove it through an approved remediation (ask me first) and rotate/notify as needed.
- **D5** MUST verify payments on the SERVER, never from a "payment succeeded" flag sent by the browser. Verify the webhook signature (or call the provider server-to-server), AND check that the provider status is successful and that the order id, amount, currency, and merchant account match what YOUR server expects. Bind each payment to the intended order, and deduplicate fulfilment atomically (unique payment id / DB transaction) so a repeated or replayed webhook cannot deliver twice.

## 3. Protect it while stored and moving

- **D6** All traffic MUST use TLS (see `security.md` S14). Connections to databases, caches, and queues over any network, INCLUDING private networks, MUST use authenticated TLS: validate the server certificate and hostname, with no insecure fallback (no `sslmode=disable`, no `rejectUnauthorized: false`).
- **D7** MUST enable encryption at rest: provider disk/database encryption, and field-level encryption (AES-256-GCM via a maintained library, unique nonce per value) for highly sensitive fields (national ID, documents, third-party account tokens). Encryption keys MUST live in a secret manager/KMS, never next to the data or in the repo.
- **D8** Least privilege on reading: every table/route returns only the fields the caller needs (explicit `select`/DTOs, never `SELECT *` to the client). The admin panel shows masked values by default. Users can only read their OWN records (check ownership on the server).
- **D9** MUST mask personal data in logs, error messages, analytics, and error trackers (Sentry etc.): phone `0912***4567`, email `a***@gmail.com`, card last 4 only. NEVER log passwords, tokens, full request bodies of login/payment routes, or `Authorization`/`Cookie` headers. Add a redaction helper or middleware and use it everywhere. NEVER put personal data in URLs or query strings.

## 4. Retention and deletion (when to delete)

- **D10** MUST define a deletion schedule in the inventory and implement it as an automatic job (cron/scheduled function), not a manual TODO. Proposed defaults (owner decides):
  - password reset / email verification / OTP tokens: delete at expiry (within 24 h)
  - expired or revoked sessions: delete after expiry
  - auth and access logs: 30–90 days
  - temporary uploads, exports, and carts: 7–30 days
  - inactive accounts: warn by email, then delete or anonymise after a period the owner chooses
  - data you no longer need for the feature that collected it: delete it
- **D11** MUST provide a "Delete my account" feature: re-authenticate, confirm, invalidate ALL sessions and tokens of that user (access, refresh, remember-me; see `auth.md` A12), then delete or irreversibly anonymise the user's data across the DB (cascade), file storage, search index, caches, and third-party services (email list, analytics, payment-provider customer, CRM). Keep only what the law requires (e.g. invoices) and write that exception in the inventory. Optional: grace period of at most 30 days with the option to cancel. Also offer "download my data" if feasible.
- **D12** Backups MUST be encrypted, access-restricted, automatic, and stored in a different place than the main data (rule of thumb: 3 copies, 2 media types, 1 off-site). Set a backup retention (e.g. 30 days) so deleted data ages out. TEST a restore at least once and after every big change. After restoring a backup, re-apply account deletions made since that backup.

## 5. Other places data leaks

- **D13** NEVER send personal data to AI APIs, analytics, or other third parties unless necessary; strip or mask it first. List every third party that receives user data in the inventory.
- **D14** NEVER copy production data to dev/staging/laptops. Use fake seed data.
- **D15** Keep a short, honest privacy policy page that matches the inventory (what you collect, why, how long, how to delete).
- **D16** Have a basic incident plan in `docs/security/incident.md`: who to tell, how to rotate keys (`security.md` S8), how to notify affected users, what to log.

## How to verify (examples)

- Search the schema for columns named `card`, `cvv`, `pan`, `ssn`, `national_id`. Any PAN/CVV/PIN storage FAILS D4 and must be removed (it cannot be justified). Other sensitive fields need a documented justification in the inventory, or removal.
- Review logging calls near login/payment/user code (`console.log`, `logger.*`): no sensitive values printed.
- Create a test user, delete the account, then query every table and storage bucket for their id/email: zero rows/files left (except documented legal exceptions), and old tokens no longer work.
- Check a scheduled job exists for each retention line of the inventory.
- Check the DB/cache connection strings enable TLS with certificate verification.

## How to report back to me (گزارش به من)

Answer in Persian, in simple words. First show the filled `data-inventory.md` table (masked examples only). Then ONE table for rules D1–D16:

| # | قانون | وضعیت (✅ / ❌ / ➖) | شاهد (فایل:خط، کوئری، خروجی؛ بدون داده یا رمز واقعی) | کار لازم |
|---|-------|------|------|------|

List separately the retention periods that need MY decision. Ask before deleting any real data or changing the database.

Reference: OWASP Cheat Sheets (Logging, Cryptographic Storage, User Privacy Protection, Third Party Payment Gateway Integration), OWASP Top 10:2021 A02, OWASP ASVS 5.0.0 (V12 Secure Communication, V14 Data Protection), PCI DSS (never store CVV after authorization).
````

### hack.md

````markdown
# hack.md — Find common attack paths and fix them

> این فایل از AI می‌خواد مثل یه هکر فکر کنه: هوش مصنوعی راه‌های حملهٔ رایج رو می‌گرده، هر چی پیدا کرد با شاهد گزارش می‌ده و کمکت می‌کنه درستش کنی — ولی تضمین نمی‌ده همه‌چی پیدا بشه.
> فقط روی سایت و پروژهٔ خودت استفاده کن.

## Instructions for the AI assistant

Act as a defensive application-security reviewer (white-box audit). Follow the procedure below in order. You review and fix MY project; you do not attack anything else. You check the common attack paths; you cannot prove that nothing is left, so say what you did NOT verify. Never print real secrets or personal data in findings; redact them.

How to read the rules: every item has an ID (H1, H2...) that `checklist.md` uses. Keep the IDs when you report. Think like an attacker, but act like a developer: find, document, fix, re-test.

- **H1 Scope.** MUST test only this project, running locally or on my staging copy, with test accounts and fake data. NEVER scan, probe, or send exploit traffic to systems I do not own, third-party services, or the live production database. Do not run destructive tests (deleting data, flooding) at all. If a test could affect production, stop and ask me.

## Step 1 — Map the attack surface

- **H2** Build a table of everything an outsider can reach: pages and API routes (method + path), forms, file uploads, webhooks, WebSocket endpoints, admin panel, cron/background endpoints, OAuth/OIDC callbacks (check them against `auth.md` A17), public storage buckets, direct DB access (Supabase RLS / Firebase rules / exposed ports), third-party scripts, and env/config files. Save it as `docs/security/attack-surface.md`.

| Route / asset | Method | Auth required? | Input it accepts | Role needed | Notes |
|---------------|--------|----------------|------------------|-------------|-------|

## Step 2 — Check each category (OWASP Top 10:2021 + extras)

- **H3 Broken access control (A01).** For every route that takes an id (`/orders/123`), verify the server checks that the logged-in user OWNS the object (IDOR). Verify admin routes check role on the server. Unauthenticated users get `401/403`, not data. Check mass assignment: each write endpoint accepts only an allowlist of fields; a user cannot set `role`, `isAdmin`, `userId`, `price`, `status`.
- **H4 Injection (A03).** Search for string-built SQL/NoSQL queries, `eval`, `exec`, `child_process`, `os.system`, unsafe template rendering. Every query is parameterized; every shell call avoids user input.
- **H5 XSS (A03).** Search for `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, `|safe`, unescaped template output. Use context-specific output encoding (HTML body, attribute, JavaScript, URL, CSS each differ) and safe DOM sinks (`textContent`). Sanitize with a maintained sanitizer (DOMPurify) ONLY where HTML is intentionally accepted. Validate URL schemes (`https:` / `http:` only, no `javascript:`), and never interpolate untrusted data into scripts or event handlers. Add a CSP.
- **H6 CSRF.** State-changing routes using cookies, including login and logout, need SameSite plus a CSRF token or an exact trusted-`Origin` check (missing, `null`, or untrusted origins are rejected). See `auth.md` A11, A16.
- **H7 SSRF (A10).** Any feature that fetches a user-supplied URL (image import, webhook, link preview, AI "browse") MUST: allow only needed schemes (`https`) and ports; resolve DNS and validate ALL resulting IPv4 and IPv6 addresses against an allowlist/blocklist (block loopback, private, link-local, and cloud metadata such as `169.254.169.254`); connect to the validated address (defends against DNS rebinding); and disable redirects or re-validate every hop.
- **H8 Security misconfiguration (A05).** Check: debug off; default credentials removed; directory listing off; unused routes/sample pages removed; storage buckets private by default; BaaS rules enabled (RLS/Firestore rules) and tested as an anonymous user; DB and admin tools not reachable from the internet.
  - **Security headers** on all HTML responses: `Content-Security-Policy` (start strict, no `unsafe-inline` if possible) that INCLUDES `frame-ancestors 'none'` (or a specific allowlist) to stop clickjacking, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. `X-Frame-Options: DENY` is an optional fallback for old browsers.
  - **CORS**: explicit origin allowlist; NEVER `Access-Control-Allow-Origin: *` together with credentials, and never reflect the request `Origin` blindly.
- **H9 Vulnerable dependencies (A06).** Run `npm audit` (or `pnpm audit`, `pip-audit`, `composer audit`, `bundle audit`), list Critical/High, upgrade them. A Critical/High finding is closed only by an upgrade/patch/removal, or by evidence that it is a false positive or not reachable in this app (written down with proof). Documentation alone does not make an unresolved Critical/High pass. Commit the lockfile, remove unused packages, and ask me before major-version upgrades.
- **H10 File upload.** Validate extension, detected content type (magic bytes), and parsed content TOGETHER (magic bytes alone are not proof of safety). Reject active formats (HTML, SVG, JS, executables) unless truly required. Max size and decompressed-size limits; random server-generated filenames; store outside the web root or in a private bucket; never execute uploads; serve untrusted files as attachments (`Content-Disposition: attachment`) with the correct `Content-Type`, or from a separate isolated origin; re-encode images when possible; malware scanning where applicable.
- **H11 Error messages (A05).** Production errors show a generic message plus a request id. NEVER return stack traces, SQL errors, file paths, or framework versions to the client. Log details server-side only.
- **H12 Rate limits.** Add limits to login, sign-up, reset, OTP/SMS, search, contact forms, file upload, and every route that costs money (AI/LLM calls, email, SMS). Set per-user and per-IP caps.
- **H13 Logging and monitoring (A09).** Security events (failed logins, access denied, role changes, rate-limit hits) are logged without sensitive data, and someone gets alerted on spikes.
- **H14 Integrity (A08) and design (A04).** Verify webhook signatures AND payment details (order, amount, currency, deduplication; see `data.md` D5); lockfiles committed; CI secrets scoped; no unpinned scripts from untrusted CDNs (use SRI); no auto-deploy from unreviewed branches. Check business-logic abuse: negative quantities, price taken from client, coupon reuse, skipping the payment step.
- **H15 If the app calls an LLM:** treat user text and fetched web content as untrusted (prompt injection); give the model only the tools/data the current user is allowed to access; never put secrets in prompts; validate model output before using it in SQL, shell, or HTML.
- **H16 Cryptographic failures (A02) and auth failures (A07):** verify against `security.md` S11–S14 and `auth.md` A1–A17.
- **H20 Unsafe deserialization and XXE (A08 / A05).** Where the app parses untrusted serialized data or XML: NEVER deserialize untrusted input into native objects (`pickle`, Java `ObjectInputStream`, PHP `unserialize`, `node-serialize`, YAML `load` with arbitrary tags); parse with safe parsers and validate against a schema (JSON + `zod`/`pydantic`); disable XML external entities, external DTD loading, and unnecessary entity expansion in every XML parser.

Useful local tools (run against my own local/staging app only): `npm audit`, `gitleaks --redact`, `semgrep` (static analysis), `OWASP ZAP` baseline scan, `curl -I` for headers.

## Step 3 — Write the findings

- **H17** Save `docs/security/findings.md` with one row per problem. Severity: **Critical** (remote data theft/takeover, exposed secrets), **High** (access-control bypass, injection, XSS on authenticated pages), **Medium** (missing headers, weak limits), **Low** (hardening, info leaks).

| ID | Severity | Location (file:line / route) | What an attacker could do | Fix | Status |
|----|----------|------------------------------|---------------------------|-----|--------|

## Step 4 — Fix

- **H18** Fix Critical first, then High, then Medium, then Low. One fix per commit with a clear message. After each fix, add or run a test that would have caught the problem, and re-test. Ask me BEFORE risky changes: DB migrations, deleting data, auth rewrites, major dependency upgrades, rotating live keys. Do not "fix" by disabling a security feature.
- **H19** When done, re-run Steps 1–3 on the changed areas and update the table. Report anything you could not verify honestly as "not verified".

## How to report back to me (گزارش به من)

Answer in Persian, in simple words, not technical jargon. Give a short summary first (how many Critical/High/Medium/Low found, how many fixed, what you could not verify). Then ONE table:

| شدت | کجا | هکر چی کار می‌تونست بکنه (ساده) | راه‌حل | وضعیت (درست شد ✅ / مونده ❌ / منتظر تأیید تو ⏳) |
|-----|-----|-----------|-------|------|

End with: the 3 most important things I should know, and the list of risky changes waiting for my approval.

Reference: OWASP Top 10:2021, OWASP ASVS 5.0.0 (V1 Encoding and Sanitization, V3 Web Frontend Security, V4 API and Web Service, V5 File Handling, V8 Authorization, V13 Configuration), OWASP Cheat Sheet Series (SSRF Prevention, XSS Prevention, CSRF Prevention, File Upload, Content Security Policy, Deserialization, XXE Prevention).
````

### checklist.md

````markdown
# checklist.md — Pre-release security checklist

> این فایل همهٔ چیزهایی که تو چهار فایل قبلی گفتیم رو یه‌جا جمع کرده. قبل از هر انتشار جدید (ریلیز) بده به AI تا یکی‌یکی چکشون کنه و بهت بگه کدوم درسته و کدوم نه.

## Instructions for the AI assistant

**Before EVERY release, go through this list one by one and report each item as ✅ (passed), ❌ (failed or not verified) or ➖ (not applicable, with evidence that the feature is absent), WITH EVIDENCE.**

Rules for the check:

1. Evidence means something concrete: file and line, command output, test result, a `curl` response, or a screenshot description. "Looks fine" is not evidence.
2. If you could not verify an item, mark it ❌ with "not verified". NEVER mark ✅ by assumption.
3. Every **applicable** item marked **[BLOCKER]** must be ✅ for the release to go out. ➖ is allowed only with evidence that the feature is absent (e.g. no user accounts, no payments). A failed or unverified applicable blocker means: say clearly "Do not release" and list the fixes.
4. Details and exact wording of each rule are in `security.md` (S), `auth.md` (A), `data.md` (D), `hack.md` (H). This file only lists them; open the source file when you need the full rule.
5. Only check my own project (local or staging). Ask before running anything that touches production.

## 1. Secrets and basics (security.md)

- [ ] **S1** No secrets in code, config, tests, or logs **[BLOCKER]**
- [ ] **S2** `.env*` in `.gitignore`; `.env.example` has placeholders only **[BLOCKER]**
- [ ] **S3** No secret in frontend bundle or `NEXT_PUBLIC_`/`VITE_`/`REACT_APP_` vars; public keys are protected by backend rules **[BLOCKER]**
- [ ] **S4** Separate keys for dev / staging / production
- [ ] **S5** Keys have least privilege and spending limits
- [ ] **S6** Privileged/confidential-credential calls (AI, payment, SMS...) run on the backend; browser SDKs use only restricted public keys
- [ ] **S7** Secret scanning (`gitleaks`) ran on code and full history: no findings **[BLOCKER]**
- [ ] **S8** No leaked key is still active (rotated first; git history rewritten only if it was committed, with my approval)
- [ ] **S9** No real secret was pasted into AI chats, issues, or screenshots
- [ ] **S10** Passwords of hosting/DB/GitHub/email are in a password manager with 2FA on
- [ ] **S11** Passwords hashed with Argon2id (or scrypt / PBKDF2 for FIPS; bcrypt legacy only), real parameters verified, no truncation, no plaintext/MD5/SHA1 **[BLOCKER]**
- [ ] **S12** Password policy follows NIST rev. 4 (15+ chars if password-only, 8+ only with enforced MFA, 64+ allowed, no truncation, breached check, no forced composition/rotation)
- [ ] **S13** Tokens/IDs come from a secure random generator
- [ ] **S14** HTTPS only, HTTP redirects, HSTS header present (staged rollout; `includeSubDomains`/preload only after a subdomain inventory) **[BLOCKER]**
- [ ] **S15** All DB queries parameterized **[BLOCKER]**
- [ ] **S16** Server-side schema validation and writable-field allowlists/DTOs on every write endpoint (no mass assignment)
- [ ] **S17** Debug off, no default credentials, DB user has least privilege **[BLOCKER]**

## 2. Login and sessions (auth.md)

- [ ] **A1** Generic error for wrong email/password; no account enumeration (login, sign-up, reset)
- [ ] **A2** Rate limiting on login, sign-up, reset, OTP
- [ ] **A3** Lockout/backoff: 5 failures in 15 min → 15 min lock, stored server-side **[BLOCKER]**
- [ ] **A4** Breached-password check on sign-up/change/reset
- [ ] **A5** Failed logins and password changes are logged (without secrets) and the user is notified
- [ ] **A6** Cookies: `HttpOnly`, `Secure`, `SameSite` (`__Host-` prefix: `Path=/`, no `Domain`) **[BLOCKER]**
- [ ] **A7** Random server-validated session IDs; nothing sensitive in `localStorage`
- [ ] **A8** Session ID rotated on login and privilege change
- [ ] **A9** Idle timeout and absolute timeout enforced; sensitive actions need fresh re-authentication
- [ ] **A10** Logout deletes the session on the server, revokes refresh + remember-me tokens, kills access tokens, clears the cookie **[BLOCKER]**
- [ ] **A11** Logout is `POST` with CSRF protection; old cookie/tokens after logout return `401`; no cached private pages
- [ ] **A12** "Log out all devices"; all sessions/tokens end after password change, reset, account deletion and disablement
- [ ] **A13** Reset tokens: single-use, hashed, expiring (15–60 min) **[BLOCKER]**
- [ ] **A14** Email verification; re-auth for sensitive actions
- [ ] **A15** 2FA available; required for admin accounts
- [ ] **A16** Server-side authorization on every request; CSRF protection on state-changing routes **[BLOCKER]**
- [ ] **A17** If social login is used: PKCE S256 + state, exact redirect URIs; OIDC: nonce + ID token validated, user keyed on (iss, sub); no email-only account merging
- [ ] **A-T** The 8 tests listed in `auth.md` were run and passed

## 3. User data (data.md)

- [ ] **D1** `docs/security/data-inventory.md` exists and matches the current database/forms
- [ ] **D2** No field is collected without a reason
- [ ] **D4** No full card number / CVV / PIN stored or logged; payments via provider's hosted page/SDK **[BLOCKER]**
- [ ] **D5** Payments verified on the server: signature + status + order/amount/currency/merchant match; fulfilment deduplicated
- [ ] **D6** Authenticated TLS for all traffic, including DB/cache connections on private networks (certificate + hostname validated, no insecure fallback)
- [ ] **D7** Encryption at rest; sensitive fields encrypted; keys in a secret manager
- [ ] **D8** APIs return only needed fields; users read only their own data; admin panel masks values
- [ ] **D9** Logs, errors, and error trackers mask personal data; no PII in URLs **[BLOCKER]**
- [ ] **D10** Automatic deletion jobs exist for every retention line
- [ ] **D11** "Delete my account" works end to end (DB, files, third parties) and invalidates all sessions/tokens
- [ ] **D12** Backups are encrypted, automatic, retention set, restore tested
- [ ] **D13** No unnecessary personal data sent to AI/third parties
- [ ] **D14** No production data in dev/staging
- [ ] **D15** Privacy policy matches reality
- [ ] **D16** Incident plan exists (`docs/security/incident.md`)

## 4. Attack paths (hack.md)

- [ ] **H2** `docs/security/attack-surface.md` is up to date for new routes/forms/uploads
- [ ] **H3** Every object route checks ownership (no IDOR); admin routes check role; no mass assignment **[BLOCKER]**
- [ ] **H4** No injection (SQL/NoSQL/command) **[BLOCKER]**
- [ ] **H5** No unsafe HTML rendering; CSP set
- [ ] **H6** CSRF protection verified
- [ ] **H7** URL-fetching features block internal addresses (SSRF)
- [ ] **H8** Security headers set (CSP incl. `frame-ancestors`); CORS allowlist; BaaS rules (RLS etc.) tested as anonymous user **[BLOCKER]**
- [ ] **H9** `npm audit` (or equivalent): 0 open Critical/High; closed only by a fix or by evidence of false positive / not reachable (documentation alone is not enough) **[BLOCKER]**
- [ ] **H10** File uploads: type/size limits, random names, private storage
- [ ] **H11** Production errors show no stack traces or internals
- [ ] **H12** Rate limits on expensive or abusable endpoints (AI, SMS, email)
- [ ] **H13** Security events logged and alerts configured
- [ ] **H14** Webhook signatures and payment details verified; lockfile committed; business-logic abuse checked
- [ ] **H15** If the app uses an LLM: prompt injection considered, tools/data limited per user, output validated
- [ ] **H16** Crypto and auth failures cross-checked against S11–S14 and A1–A17
- [ ] **H17** `docs/security/findings.md` has no open Critical/High **[BLOCKER]**
- [ ] **H20** Unsafe deserialization and XXE checked (safe parsers, XML external entities disabled)

## 5. Deployment (release day)

- [ ] **R1** Code committed and tagged (rollback point exists) **[BLOCKER]**
- [ ] **R2** All production env vars are set on the host; none are missing or taken from `.env` in the repo
- [ ] **R3** Valid HTTPS certificate; HTTP redirects to HTTPS
- [ ] **R4** Database is not reachable from the public internet; only the app can connect
- [ ] **R5** Admin panel is protected (auth + 2FA, ideally IP-restricted); no default admin account
- [ ] **R6** Test accounts, seed data, and sample pages are removed from production
- [ ] **R7** Latest backup exists and a restore was tested recently
- [ ] **R8** Monitoring and alerts are on (errors, failed logins, cost spikes on paid APIs)
- [ ] **R9** Security headers verified on the LIVE URL (`curl -sI https://yourdomain`)
- [ ] **R10** Dependencies installed from the lockfile (`npm ci`), no dev-only packages in production
- [ ] **R11** `hack.md` audit re-run on everything changed since the last release
- [ ] **R12** Rollback steps written down and tried

## How to report back to me (گزارش به من)

Answer in Persian, simple and short. First line: "می‌شه منتشر کرد" or "منتشر نکن" (based on blockers). Then ONE table for every item above:

| # | مورد | وضعیت (✅ / ❌ / ➖) | شاهد (فایل، دستور، خروجی) | کار لازم |
|---|------|------|------|------|

After the table: the list of ❌ items ordered by danger, what you suggest for each, and what needs my approval. Save the filled report as `docs/security/release-report-YYYY-MM-DD.md`.

Reference: OWASP Top 10:2021, OWASP ASVS 5.0.0, OWASP Cheat Sheet Series, NIST SP 800-63B rev. 4.
````

---

## ۵. یادداشت ایمنی

- **فقط سایت خودت.** تست و گشتن دنبال حفره فقط روی پروژه و سیستمی که مال خودته (روی کامپیوتر خودت یا نسخهٔ staging). هیچ‌وقت سایت یا سرور کس دیگه‌ای رو تست نکن، حتی «برای شوخی». این غیرقانونیه.
- **روی دادهٔ واقعی تست نزن.** برای تست از حساب و دادهٔ فیک استفاده کن.
- **صد درصد امنیت وجود نداره.** این کیت ریسک رو خیلی کم می‌کنه و رایج‌ترین حفره‌ها رو می‌بنده، ولی تضمین نمی‌کنه سایتت هیچ‌وقت هک نشه. هوش مصنوعی هم ممکنه اشتباه کنه؛ کارای مهم (پرداخت، اطلاعات حساس) رو اگه می‌تونی یه آدم باتجربه هم ببینه.
- **این کیت مشاورهٔ حقوقی نیست.** قوانین نگه‌داری داده و حریم خصوصی هر کشور فرق داره؛ اگه کسب‌وکار جدی داری، اونم بررسی کن.
- **منابع:** OWASP Top 10 (نسخهٔ ۲۰۲۱)، OWASP ASVS (نسخهٔ 5.0.0)، OWASP Cheat Sheet Series (Authentication، Session Management، Password Storage، Secrets Management) و NIST SP 800-63B (ویرایش ۴).
