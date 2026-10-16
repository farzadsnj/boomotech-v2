# SEO, Discoverability and Measurement

## Strategy

Build authority around real services, locations, customer problems, and useful expertise. Avoid mass-produced pages. The primary organic opportunity is a combination of Brisbane/local service intent, Australian remote-service intent, problem-solving guides, and commercial research content.

## Technical SEO

- Server-render indexable public pages.
- Unique, human-written title and meta description.
- One canonical URL per indexable page.
- Generate XML sitemap(s) and intentional robots rules.
- Use semantic headings, descriptive links, image dimensions, optimised formats and useful alt text.
- Prevent indexing of cart, checkout, account, booking confirmation, support confirmation, search results, filters, previews and thin states.
- Handle redirects and retired content deliberately.
- Provide helpful 404 and unavailable-content pages.
- Add Open Graph/social metadata.
- Monitor Core Web Vitals and crawl/index coverage after launch.

## Structured data

Use only when page content supports it:

- `Organization`
- `LocalBusiness` or a more accurate subtype after business details are verified
- `Service`
- `Product` and `Offer`
- `Article`
- `BreadcrumbList`
- `FAQPage` only where current search-engine policy and visible content permit

Never add fake ratings, aggregate reviews, prices, availability, locations, or business hours.

## Information architecture

Use service pages for what BoomoTech provides, solution pages for customer context/outcomes, and articles for questions. Link between them intentionally. Do not create several pages targeting the same intent.

## Local SEO

After verification:

- consistent business name, phone, service area and hours;
- accurate Google Business Profile;
- Brisbane/SEQ relevance in genuine copy;
- real service-area explanation;
- local case studies and partnerships where permission exists.

Do not create duplicate suburb pages with swapped place names. Create a location page only when it provides unique operational information and real proof.

## Initial keyword themes

Validate with research before finalising:

- IT support Brisbane
- small business IT support Brisbane
- onsite computer support Brisbane
- remote IT support Australia
- Microsoft 365 support Brisbane
- business Wi-Fi and network support
- cybersecurity support for small business
- AI automation for small business Australia
- business process automation Brisbane
- website development Brisbane
- technology consultation Brisbane

These are themes, not instructions to stuff exact phrases.

## Analytics plan

Choose a privacy-conscious stack. Track meaningful events:

- support flow started/submitted;
- booking type selected/completed;
- quote request submitted;
- service CTA selected;
- product viewed/added/checkout completed;
- article-to-service CTA;
- contact action;
- form error/abandonment at aggregate level.

Do not send support descriptions, names, emails, phone numbers, uploaded files, order details, or other personal data to analytics.

## Search and content governance

- Every page has an owner, status, and review date.
- Review security, product, price and technical guidance regularly.
- Consolidate overlapping content.
- Maintain redirects during migrations.
- Add Search Console and analytics only with approved accounts and consent configuration.
- Report qualified enquiries and conversions, not rankings alone.

## Launch checklist

- Verify domain and preferred host
- Confirm production canonical origin
- Validate sitemap and robots
- Test metadata and structured data
- Check indexability/noindex rules
- Audit broken links and redirects
- Test performance on representative mobile conditions
- Configure privacy-safe analytics and consent
- Connect search tooling
- Establish baseline conversions

## Production indexing control

Indexing is fail closed. `SITE_INDEXING_ENABLED=true` is honoured only when
`SITE_URL` resolves to the exact approved origin `https://boomotech.com.au`.
Local, preview and staging hosts continue to emit `noindex, nofollow`, disallow
crawling and return an empty sitemap even if the flag is copied accidentally.

Page records carry an explicit `indexing` value. Only approved public records,
published articles and explicitly approved standalone routes enter the sitemap.
Authentication, dashboards, administrator routes, APIs, the consultation request,
draft legal content and unavailable workflows stay out of the sitemap. Sensitive
responses also carry an `X-Robots-Tag` defence in depth header.

Changing an environment variable does not alter an existing Next.js build. After
owner and legal approval, build and restart the reviewed commit with:

```env
SITE_URL=https://boomotech.com.au
SITE_INDEXING_ENABLED=true
```

Then purge or revalidate the Cloudflare cache for `/`, `/robots.txt` and
`/sitemap.xml`. Verify the final public responses before submitting
`https://boomotech.com.au/sitemap.xml` in Google Search Console. Use URL Inspection
for the homepage and representative service/article pages and request indexing only
after the live canonical, robots meta and status code are correct. Google decides
when and whether to index a page; sitemap submission is not confirmation.
