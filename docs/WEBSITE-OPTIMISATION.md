# Website Optimisation and Indexing Audit

Audit date: 15 October 2026  
Branch: `feat/website-optimisation-audit`  
Production origin reviewed: `https://boomotech.com.au`

This document separates verified repository changes from owner, server and
Cloudflare actions. It does not claim that the reviewed branch is deployed or
that Google has indexed the site.

## Executive summary

The live site was deliberately failing closed because its deployed build did
not have the approved indexing gate enabled. Live checks found `noindex,
nofollow` in the homepage, `Disallow: /` in `robots.txt` and an empty sitemap.
The page-specific canonical URLs were otherwise correct. Cloudflare was serving
the live responses dynamically, with a cached/revalidated robots response.

The application now requires two conditions before indexing is possible:

1. `SITE_INDEXING_ENABLED=true`; and
2. `SITE_URL` is exactly `https://boomotech.com.au`.

An HTTPS preview or staging domain therefore remains non-indexable. Page records
also have an explicit publication decision, and only reviewed public records,
published articles and approved standalone routes enter the sitemap. Sensitive
routes receive both metadata controls and `X-Robots-Tag` response headers.

The performance work reduces hydration by moving the header, hero visual and
reveal markup to Server Components, replacing per-section reveal observers with
one observer, removing the client route-transition wrapper, loading the chatbot
panel only when opened, and removing unused interaction styles.

## Verified root cause and live evidence

On 14 October 2026, direct requests to the public origin showed:

- `/`: `noindex, nofollow`, canonical `https://boomotech.com.au`;
- `/robots.txt`: `User-Agent: *` and `Disallow: /`;
- `/sitemap.xml`: a valid but empty URL set;
- `/services/it-support`: its own canonical URL but `noindex, nofollow`;
- account and administrator entry points retained private/no-store handling.

These responses match the repository's intentional disabled state. The gate was
false or absent when the active production build was created. Updating Git alone
cannot change this output because Next.js metadata and server-rendered feature
decisions are part of the deployed build. No conflicting repository middleware
was found. The operator must still inspect effective Nginx and Cloudflare rules
for injected `X-Robots-Tag` values or stale cached documents.

## SEO changes in this branch

- The root layout no longer supplies a homepage canonical to every route.
- The homepage, catch-all content, blog index, articles, shop preview and other
  standalone routes retain their own canonical URLs.
- Public page definitions use `indexing: "public"`; draft and operational pages
  use `indexing: "noindex"`.
- The sitemap contains only approved public page records, the homepage, blog,
  published articles and the IT health check. The sample shop is included only
  when separately enabled.
- Production robots rules allow public crawling and explicitly disallow private
  route families. Disabled environments disallow all crawling and expose no
  sitemap location.
- Public service pages emit `Service` and breadcrumb structured data. The root
  emits conservative `Organization` data using verified facts only. Articles
  retain `BlogPosting`, publisher and breadcrumb data.
- Public content and article metadata includes branded Open Graph and Twitter
  images.
- Sensitive responses include `X-Robots-Tag: noindex, nofollow, noarchive` as a
  defence in depth control.

Do not add `LocalBusiness`, prices, ratings, opening hours, an address, an ABN or
contact fields until those facts are verified and approved for publication.

## Performance evidence

### Supplied public laboratory result

The supplied mobile PageSpeed result reported FCP 1.5 s, LCP 3.1 s, TBT 90 ms,
CLS 0.029 and Speed Index 3.9 s. It also reported about 70 KiB unused JavaScript,
12 KiB legacy JavaScript, a render-blocking estimate of 560 ms, one long task and
one non-composited animation. These are laboratory observations, not field Core
Web Vitals.

### Local baseline

The baseline was a production build served by `next start` on
`http://127.0.0.1:3200`, measured with Playwright Chromium on the same Windows
machine. There was no network or CPU throttling, so the numbers are useful only
for before/after comparison and cannot replace mobile Lighthouse or public field
data.

| Viewport | Build | FCP range | LCP range | CLS | JS transfer | Resources | Wall range |
|---|---|---:|---:|---:|---:|---:|---:|
| 390×844 | Before | 176–308 ms | 312–456 ms | 0 | 211,007 B | 30 | 836–1,046 ms |
| 390×844 | After | 184–380 ms | 336–548 ms | 0 | 207,421 B | 28–30 | 853–1,167 ms |
| 1280×800 | Before | 204–212 ms | 332–348 ms | 0.00036–0.00039 | 227,660 B | 39 | 869–921 ms |
| 1280×800 | After | 200–244 ms | 348–388 ms | 0.00036–0.00039 | 224,074 B | 39 | 904–963 ms |

The initial JavaScript transfer fell by 3,586 bytes at both viewports. The local
timing ranges did not establish a loading-speed improvement: the after runs were
within or slightly slower than normal unthrottled machine variance. This result
is reported as measured rather than being presented as a performance win. A
throttled Lighthouse run and a new public PageSpeed run are still required to
judge the supplied 3.1 s LCP finding. The installed project does not include the
Lighthouse CLI, so no Lighthouse score was fabricated.

## Application performance changes

- `SiteHeader` and `HeroVisual` no longer hydrate for scroll or pointer effects.
- One route-aware `RevealObserver` replaces many independent observers while
  server-rendered content remains visible without JavaScript.
- CSS route-entry motion replaces the client page-transition wrapper.
- The chatbot launcher remains immediately available, while the booking/service
  panel and its dependencies load only after an explicit open action.
- The unused scrolled-header rule and pointer-tracking styles were removed.
- Versioned Next.js static assets retain Next.js's built-in immutable caching;
  robots and sitemap responses use short revalidation.

The existing `next/font` Inter and Manrope setup self-hosts generated subsets,
uses `display: swap`, and avoids third-party font connections. No speculative
preconnect was added.

The current homepage build emits two stylesheet requests totalling about 23.5
KiB transferred (about 120 KiB decoded) in the local production-server check.
The larger “CSS initiated” number reported by the initial measurement script was
font transfer initiated by CSS, not stylesheet bytes. The shared stylesheet was
retained because splitting by nested route would add complexity without reliable
evidence of a smaller homepage critical path for the current navigation graph.

## Nginx and Cloudflare review

The reviewed Nginx example now enables gzip for compressible text assets on the
loopback origin hop. Do not assume the example has changed the active server.
Before rollout:

1. compare the active site file with
   `scripts/server/security/nginx-boomotech-origin.conf.example`;
2. run `sudo nginx -t` before reload;
3. confirm Cloudflare handles visitor-facing HTTP/2 or HTTP/3 and Brotli where
   enabled;
4. verify `curl --compressed -I` results for HTML, CSS, JavaScript and SVG;
5. cache only hashed `/_next/static/` assets for a long duration;
6. never publicly cache `/api/*`, `/admin/*`, `/dashboard*`, authentication,
   token or private request responses;
7. avoid a blanket Cloudflare “Cache Everything” rule for application HTML; and
8. verify neither layer injects a site-wide noindex header.

Cloudflare cache changes and active Nginx changes require separate operator
review; this branch does not connect to either control plane.

## Business credibility review

Verified content currently identifies BoomoTech, founder Farzad Sanjarani,
Brisbane/Queensland and suitable remote availability across Australia. Services,
support preparation and the request process avoid invented prices, guarantees,
SLAs, awards, partnerships and testimonials. No Marvin McKinney or Sophia
Rodriguez profile exists in the reviewed content.

`src/content/business.ts` is the controlled location for missing owner facts.
The following remain `TODO(owner)` and are not rendered or placed in schema:

- registered legal entity name and public ABN;
- monitored public email and public phone number;
- whether a street address is a genuine public office;
- public contact hours;
- approved onsite service area and travel terms.

Legal copy, consent wording, retention/deletion decisions, response language and
operational availability still require owner/legal approval. Do not infer them
from the website design.

## Production enablement

After the owner approves public content and legal/operational details, set these
values in the protected production environment:

```env
SITE_URL=https://boomotech.com.au
SITE_INDEXING_ENABLED=true
BETTER_AUTH_URL=https://boomotech.com.au
```

`BETTER_AUTH_URL` must use the same approved public origin. The deployment
validation rejects a production build when these origins disagree.

Use the existing reviewed deployment runbook. At a high level:

```bash
cd /var/www/boomotech
./scripts/deploy-production.sh --dry-run
./scripts/deploy-production.sh
```

The script performs the clean-tree, environment, backup, fast-forward,
dependency, test, migration, build, restart and health gates documented in
`docs/DEPLOYMENT.md`. Do not run it from this feature branch and do not bypass
its backup or migration controls.

After deployment:

```bash
curl -sS https://boomotech.com.au/robots.txt
curl -sS https://boomotech.com.au/sitemap.xml
curl -sSI https://boomotech.com.au/
curl -sSI https://boomotech.com.au/admin
```

Purge or revalidate Cloudflare for `/`, `/robots.txt` and `/sitemap.xml`, then
inspect the rendered robots meta and canonical on the homepage, one service and
one article. Submit the sitemap in Google Search Console and use URL Inspection;
do not report a page as indexed until Search Console confirms it.

## Rollback

If public indexing or caching output is wrong:

1. set `SITE_INDEXING_ENABLED=false` in the protected environment;
2. rebuild and restart the last reviewed application commit through the normal
   deployment and backup process;
3. purge/revalidate the affected Cloudflare URLs;
4. verify the homepage returns `noindex, nofollow`, robots disallows `/`, and the
   sitemap is empty; and
5. investigate the application, Nginx and Cloudflare layers before re-enabling.

For an application regression, deploy the previously reviewed Git commit using
the documented rollback and database compatibility checks. Do not roll back a
database migration blindly.

## Remaining measurement work

- Run throttled Lighthouse mobile and desktop against the final production-like
  build if Lighthouse tooling is available.
- Re-run public PageSpeed after reviewed deployment and cache warm-up.
- Monitor Search Console coverage and real-user Core Web Vitals after sufficient
  traffic exists.
- Confirm effective compression and cache headers at Cloudflare and Nginx.
- Review any remaining unused JavaScript against the generated bundle analyzer
  rather than removing framework code blindly.
