# گزارش انتشار امنیتی — ۱۱ اکتبر ۲۰۲۶

**به‌روزرسانی ۲۰ اکتبر ۲۰۲۶ — منتشر نکن.** اصلاحات A3، MFA اجباری مدیر و SEC-017 از طریق PR #27 در `main` ادغام شده‌اند، اما migration در تولید اجرا نشده و مدیران تولید هنوز در این بازبینی ثبت MFA نشده‌اند. بررسی‌های PR موفق بودند، ولی وضعیت زنده هشدار CodeQL از این محیط به‌طور مستقل قابل مشاهده نبود. جزئیات در `auth-remediation-2026-10-13.md` است.

این گزارش سه نوع شاهد را جدا می‌کند:

- **مخزن:** کد، تنظیمات، مستندات و CI بررسی شده‌اند.
- **محلی:** تست‌ها فقط روی نسخه محلی با داده ساختگی اجرا شده‌اند.
- **تولید:** سرور، سرویس‌دهنده‌ها، کلیدها، حساب مالک و داده واقعی بررسی یا تغییر نکرده‌اند.

`SECURITY-KIT-GUIDE.md` راهنمای مرجع این کیت است. فایل فارسی هم‌نام، byte-for-byte همان محتوا را داشت و برای جلوگیری از دو منبع متناقض حذف شد؛ پنج سیاست اجرایی `security.md`، `auth.md`، `data.md`، `hack.md` و `checklist.md` بدون تغییر باقی ماندند.

نمادها: ✅ پاس، ❌ ناموفق/مانع، ➖ نامرتبط یا نیازمند شاهد تولید.

## S1–S17 — اسرار و اصول پایه

| # | وضعیت | شاهد | کار لازم |
|---|---|---|---|
| S1 | ✅ | بازبینی مخزن، اسکن الگوها و CI بدون قرار دادن مقدار محرمانه در خروجی | اسکن تاریخچه Gitleaks باید در هر PR پاس بماند |
| S2 | ✅ | `.gitignore` فایل‌های محیطی را می‌بندد و `.env.example` فقط نام/جای‌خالی دارد | همین الگو حفظ شود |
| S3 | ✅ | `scripts/check-client-bundle-secrets.ts` خروجی کلاینت را با مقدارهای تنظیم‌شده مقایسه می‌کند | پس از هر build اجرا شود |
| S4 | ➖ | جداسازی کلیدهای محیط‌ها از مخزن قابل اثبات نیست | مالک باید کلیدهای dev/staging/prod را جدا کند |
| S5 | ➖ | scope، سقف هزینه و محدودیت ارائه‌دهنده‌ها محلی قابل مشاهده نیست | در OpenAI، Resend و میزبان محدودیت اعمال شود |
| S6 | ✅ | OpenAI، Resend و DB فقط از route/worker سرور فراخوانی می‌شوند | حفظ شود |
| S7 | ✅ | اسکن کامل تاریخچه با خروجی redacted اجرا شد؛ CI نیز Gitleaks دارد | push protection میزبان فعال بماند |
| S8 | ➖ | نشتی فعال پیدا نشد؛ وضعیت چرخش کلیدهای واقعی بررسی نشد | مالک لاگ و چرخه کلید ارائه‌دهنده را تأیید کند |
| S9 | ➖ | مخزن و این گزارش مقدار واقعی ندارند؛ چت‌ها/تیکت‌های خارجی قابل بررسی نبودند | مالک کانال‌های خارجی را بررسی کند |
| S10 | ➖ | password manager و 2FA حساب‌های مالک قابل بررسی نبود | مالک برای GitHub، دامنه، ایمیل و میزبان تأیید کند |
| S11 | ✅ | تست Argon2id پارامترهای حافظه 65536 KiB، سه iteration و parallelism یک را بدون چاپ hash تأیید می‌کند | تست رگرسیون حفظ شود |
| S12 | ✅ | ۱۵–۱۲۸ code point، Unicode/space، بدون composition و HIBP range API در `src/lib/auth` | tradeoff fail-open ارائه‌دهنده بازبینی شود |
| S13 | ✅ | Better Auth و توکن‌های برنامه از crypto امن استفاده می‌کنند؛ استفاده امنیتی از `Math.random` پیدا نشد | حفظ شود |
| S14 | ❌ | header و runbook موجود است، اما HTTPS redirect/HSTS روی URL زنده بررسی نشد | rollout روی staging و سپس تولید تأیید شود |
| S15 | ✅ | Drizzle/Postgres parameterized API استفاده شده؛ SQL ساخته‌شده از ورودی پیدا نشد | بازبینی هر query جدید |
| S16 | ✅ | routeهای write با Zod و DTO محدود، هویت/نقش server-derived؛ تست mass assignment اضافه شد | تست‌ها حفظ شوند |
| S17 | ❌ | production fallbackها بسته‌اند، اما least-privilege نقش DB و نبود debug روی میزبان اثبات نشد | روی میزبان و DB نقش محدود تأیید شود |

## A1–A17 و هشت تست احراز هویت

| # | وضعیت | شاهد | کار لازم |
|---|---|---|---|
| A1 | ❌ | body/status خطای کاربر موجود و ناموجود برابر تست شده؛ برابری زمانی/dummy hash اثبات نشده | timing مقاوم به enumeration اندازه‌گیری و تثبیت شود |
| A2 | ✅ | Better Auth limiter دیتابیسی per-IP و `auth_login_guard` مستقل per-account/identifier است؛ production فقط `CF-Connecting-IP` را در origin loopback می‌پذیرد | مرز Cloudflare/Nginx در production تأیید شود |
| A3 | ✅ | پنج خطا در ۱۵ دقیقه با state پایدار PostgreSQL، upsert اتمیک و lock پانزده‌دقیقه‌ای تست شده است | migration تولید هنوز مجاز نیست |
| A4 | ✅ | policy و HIBP برای signup/change/reset از hook سرور اعمال می‌شود | حفظ شود |
| A5 | ❌ | eventهای custom API redacted هستند؛ همه login/reset/change و ایمیل هشدار پوشش کامل ندارند | hook و مقصد هشدار تأییدشده اضافه شود |
| A6 | ✅ | Better Auth cookieهای HttpOnly/SameSite و Secure در production؛ تست env موجود | header واقعی staging نیز بررسی شود |
| A7 | ✅ | session تصادفی و server-side DB؛ auth token در browser storage نیست | حفظ شود |
| A8 | ✅ | تست نشان می‌دهد cookie نشست پس از login تازه و بین نشست‌ها متفاوت است | تغییر نقش نیز پس از MFA آینده تست شود |
| A9 | ❌ | session فعلی ۷ روزه و update یک روزه است | idle ۳۰ دقیقه/absolute ۱۲ ساعت نیازمند تصمیم UX و مالک |
| A10 | ✅ | sign-out نشست سرور را باطل می‌کند | حفظ شود |
| A11 | ✅ | logout state-changing با CSRF/origin؛ replay cookie قدیمی رد و private page no-store است | E2E حفظ شود |
| A12 | ❌ | logout همه دستگاه‌ها و reset پوشش دارد؛ change/delete/disable کامل نیست | lifecycle کامل پس از تأیید طرح deletion تکمیل شود |
| A13 | ✅ | reset token هش‌شده، یک‌بارمصرف، محدود و صفحه token دارای no-referrer/no-store است | حفظ شود |
| A14 | ❌ | signup verification وجود دارد؛ تغییر ایمیل با pending/reauth/notify-old وجود ندارد | flow تغییر ایمیل طراحی شود |
| A15 | ✅ | TOTP اجباری مدیر، recovery code یک‌بارمصرف و enforcement سمت سرور محلی تست شده است | production enrollment نیازمند تأیید است |
| A16 | ✅ | تست anonymous/customer/admin، ownership، role و origin اضافه شد | routeهای جدید باید matrix مشابه داشته باشند |
| A17 | ➖ | social login پیاده نشده است | اگر اضافه شد تمام PKCE/state/nonce قواعد اعمال شود |
| A-T1 | ✅ | تست integration: خطای پنجم lock می‌کند و رمز درست تا expiry رد می‌شود | در staging پس از migration تکرار شود |
| A-T2 | ❌ | body/status برابر است؛ timing مشابه اثبات نشده | تست timing کنترل‌شده اضافه شود |
| A-T3 | ✅ | login، logout و replay cookie قدیمی در integration test | حفظ شود |
| A-T4 | ✅ | session cookie قبل/بعد و دو login متفاوت تست شد | حفظ شود |
| A-T5 | ✅ | reset token دوم و منقضی رد می‌شود | حفظ شود |
| A-T6 | ✅ | secure cookie policy برای production و dev تست شد | روی staging header واقعی بررسی شود |
| A-T7 | ❌ | reset نشست‌ها را می‌بندد؛ change-password همه دستگاه‌ها پوشش کامل ندارد | integration flow کامل شود |
| A-T8 | ❌ | logout/reset پاس؛ account deletion/disable موجود نیست | پس از تصمیم deletion تکمیل شود |

## D1–D16 — داده کاربر

| # | وضعیت | شاهد | کار لازم |
|---|---|---|---|
| D1 | ✅ | `data-inventory.md` با schema، فرم‌ها، log و third party تطبیق داده شد | با هر migration به‌روز شود |
| D2 | ❌ | بیشتر فیلدها دلیل دارند؛ برخی retention/ضرورت business هنوز تصمیم مالک است | تصمیم‌ها در inventory ثبت شود |
| D3 | ✅ | password hash، نام، ایمیل، تلفن، IP، پیام و token در inventory طبقه‌بندی شده‌اند | حفاظت‌ها حفظ شود |
| D4 | ➖ | پرداخت پیاده نشده و PAN/CVV/PIN جمع نمی‌شود | فقط hosted payment آینده مجاز است |
| D5 | ➖ | webhook/fulfilment پرداخت وجود ندارد | قبل از تجارت طراحی اتمیک لازم است |
| D6 | ❌ | HTTPS برنامه مستند است؛ DB روی loopback است ولی authenticated TLS اجباری نیست | TLS تأییدشده یا exception مکتوب مالک لازم است |
| D7 | ❌ | encryption-at-rest/KMS تولید از مخزن قابل اثبات نیست | میزبان و DB و offsite key مدیریت شوند |
| D8 | ✅ | projectionهای محدود و ownership server-side؛ admin فقط فیلدهای لازم | masking UI بازبینی دوره‌ای شود |
| D9 | ❌ | redaction helper اضافه شد؛ جست‌وجوی آزاد admin هنوز PII را در query string می‌گذارد | جست‌وجو به POST/in-memory محافظت‌شده منتقل شود |
| D10 | ❌ | maintenance بعضی داده‌ها را پاک می‌کند؛ همه خطوط retention پوشش ندارند | jobهای approved و dry-run اضافه شود |
| D11 | ❌ | حذف کامل حساب وجود ندارد | reauth، cascade/anonymise و revoke نیازمند تأیید مالک |
| D12 | ❌ | backup محلی رمزدار/محدود است؛ offsite و restore شاهد زنده ندارد | طرح `offsite-backup-plan.md` تأیید و آزمایش شود |
| D13 | ✅ | AI پیش‌فرض خاموش و chat knowledge محلی؛ ارسال داده حساب/درخواست به AI وجود ندارد | قبل از فعال‌سازی AI privacy review شود |
| D14 | ➖ | تست‌ها داده ساختگی دارند؛ رفتار تیم/میزبان قابل اثبات نیست | ممنوعیت کپی production تأیید شود |
| D15 | ❌ | privacy با پیاده‌سازی فعلی مقایسه شد؛ retention/deletion/AI نیازمند owner/legal است | متن نهایی تأیید شود |
| D16 | ✅ | `incident.md` نقش‌ها، containment، rotation و اطلاع‌رسانی را ثبت می‌کند | مخاطب و کانال واقعی تکمیل شود |

## H2–H20 — مسیرهای حمله

| # | وضعیت | شاهد | کار لازم |
|---|---|---|---|
| H2 | ✅ | `attack-surface.md` صفحات، API، فرم، worker، AI و سطوح غایب را فهرست می‌کند | با route جدید به‌روز شود |
| H3 | ✅ | matrix دسترسی routeهای request/admin و mass-assignment tests پاس است | حفظ شود |
| H4 | ✅ | query parameterized؛ eval/command با ورودی کاربر پیدا نشد | بازبینی هر shell/SQL جدید |
| H5 | ✅ | HTML ایمیل escape، React encoding و CSP موجود؛ `unsafe-inline` residual ثبت شده | nonce CSP جداگانه ارزیابی شود |
| H6 | ✅ | exact origin/state-changing routes و SameSite تست شده | حفظ شود |
| H7 | ➖ | URL fetch از کاربر وجود ندارد | هر feature آینده باید DNS/IP/redirect را بازاعتبارسنجی کند |
| H8 | ✅ | headerها، loopback bind و hardening موجود؛ BaaS استفاده نمی‌شود | live config جداگانه بررسی شود |
| H9 | ✅ | `pnpm audit --prod` بدون Critical/High | lockfile و CI حفظ شود |
| H10 | ➖ | file upload وجود ندارد | قبل از upload policy کامل لازم است |
| H11 | ✅ | APIها خطای generic می‌دهند و PII/stack به client نمی‌دهند | request ID آینده مفید است |
| H12 | ✅ | booking/chat limiter، Better Auth IP limiter و auth account lockout موجودند؛ admin mutationها origin+role+MFA را بررسی می‌کنند | تنظیم proxy تولید تأیید شود |
| H13 | ❌ | structured redacted events اضافه شد؛ alert مقصد واقعی و همه auth events کامل نیست | کانال هشدار مالک و threshold تعریف شود |
| H14 | ✅ | lockfile committed و workflow pinned؛ payment/webhook وجود ندارد | branch protection میزبان تأیید شود |
| H15 | ✅ | AI server-side، محدود، بدون tool/data خصوصی و پیش‌فرض خاموش | model output فقط متن نمایش داده شود |
| H16 | ❌ | S11–S13 و A3/A15 محلی پاس؛ A9 و live S14 همچنان تصمیم/شاهد می‌خواهند | موارد باقیمانده جداگانه بررسی شوند |
| H17 | ❌ | `findings.md` دو High باز دارد | release ممنوع تا رفع و retest |
| H18 | ✅ | safe fixes بدون migration انجام و هر کدام تست شدند | risky changes منتظر تأیید ماندند |
| H19 | ✅ | سطح تغییرکرده دوباره بازبینی و موارد ناشناخته صادقانه ثبت شد | پس از هر fix تکرار شود |
| H20 | ✅ | JSON با schema امن parse می‌شود؛ XML/native deserialization وجود ندارد | parser جدید بازبینی شود |

## R1–R12 — روز انتشار

| # | وضعیت | شاهد | کار لازم |
|---|---|---|---|
| R1 | ❌ | branch commit می‌شود، اما طبق دستور مالک tag/release ساخته نشده | rollback tag فقط با تأیید مالک |
| R2 | ➖ | prod env عمداً خوانده یا چاپ نشد | روی میزبان با checker غیرنمایشی تأیید شود |
| R3 | ➖ | production probe ممنوع بود | certificate و redirect روی live تأیید شود |
| R4 | ➖ | loopback architecture مستند است؛ firewall/DB زنده بررسی نشد | audit میزبان اجرا شود |
| R5 | ❌ | TOTP اجباری مدیر و recovery code محلی پیاده‌سازی و تست شده؛ production enrollment انجام نشده | migration و enrollment فقط با تأیید مالک، سپس retest |
| R6 | ❌ | shop/sample content feature-flagged است؛ وضعیت production زنده بررسی نشد | flags و seed/test records تأیید شوند |
| R7 | ❌ | backup script وجود دارد؛ latest backup/restore واقعی بررسی نشد | restore test ثبت‌شده لازم است |
| R8 | ❌ | monitoring scripts وجود دارد؛ alerts واقعی اثبات نشده | مقصد و escalation تأیید شود |
| R9 | ➖ | headerها محلی تست شدند؛ live URL probe انجام نشد | curl امن روی دامنه approved اجرا شود |
| R10 | ✅ | نصب با `pnpm install --frozen-lockfile` و Node/pnpm pinned | production فقط lockfile استفاده کند |
| R11 | ✅ | audit سفیدجعبه روی branch تغییرکرده تکرار شد | findings و checks به PR پیوست شود |
| R12 | ❌ | rollback مستند است، ولی در production آزمایش نشده | rehearsal مالک‌تأییدشده لازم است |

## یافته‌های بازبینی پس از Codex

- CodeQL check `114418909498` قانون `js/insufficient-password-hash` را روی SHA-1 سفارشی HIBP در فایل حذف‌شده `breached-password.ts` گزارش کرد. اجرای سفارشی حذف و plugin رسمی Better Auth جایگزین شد؛ بسته‌شدن alert نیازمند rerun واقعی GitHub است.
- SEC-017 اصلاح شد: login و admin-login اکنون سقف ۱۲۸ را با Unicode code point می‌شمارند و regression test برای ۱۲۸/۱۲۹ کاراکتر non-BMP اضافه شده است.
- اسکن full-history Gitleaks و check مربوط به secret-scan پاس شده است؛ SEC-014 به «Fixed / verified» به‌روزرسانی شد.

## سه مشکل اصلی

1. **H17 / CodeQL:** اصلاح محلی انجام شده ولی check واقعی GitHub هنوز rerun نشده است.
2. **Production evidence:** migration و enrollment مدیر، TLS دیتابیس، offsite backup و restore واقعی نیازمند تأیید/شاهد تولید هستند.

## نتیجه

- مخزن و تست محلی بهبود یافته‌اند، ولی این کار مجوز انتشار نیست.
- هیچ سرور تولید، حساب واقعی، کلید، backup یا provider تغییر نکرد.
- migration و تغییر flow احراز هویت فقط در کد/دیتابیس تست محلی اجرا شده‌اند؛ production تغییر نکرده است.

SECURITY RELEASE GATE: DO NOT RELEASE
