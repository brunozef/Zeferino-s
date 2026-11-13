# SEO notes

## Service pages (indexable URLs)
The home page is a single-page app with hash routes (`/#services`, `/#city-...`). Google ignores
everything after `#`, so those views are not separate URLs. These real pages target local searches:

| URL | Target search |
|---|---|
| /finish-carpentry-fort-myers/ | finish carpentry Fort Myers |
| /trim-carpentry-naples/ | trim carpentry Naples |
| /crown-molding-installation/ | crown molding installation |
| /baseboard-installation/ | baseboard installation |
| /interior-trim-installation/ | interior trim installation |
| /custom-carpentry-southwest-florida/ | custom carpentry Southwest Florida |

They are generated. Edit `scripts/build-seo-pages.mjs`, then run:

    node scripts/build-seo-pages.mjs

This rewrites the six pages, `css/site.css` (copied from the home page styles) and `sitemap.xml`.
Run it again after changing the home page styles. Only publish facts that are verified:
no address, licence, insurance, ratings or review counts unless they are real.

## Structured data
- Home: `WebSite` + `HomeAndConstructionBusiness` (`@id` https://www.zeferinosusa.com/#business).
  Service-area business: no street address is published on purpose.
- Service pages: `Service` (provider = the business `@id`) + `BreadcrumbList`.
- The business `name` must match the Google Business Profile name exactly. Check it there.

## Crawling
- `robots.txt` allows everything except `/api/` and points to the sitemap.
- `/crm/` is sent with `X-Robots-Tag: noindex, nofollow` (and has a robots meta tag).
- `/index.html`, `/cleaning/index.html` and `/<service>/index.html` redirect (308) to the clean URL.
- `index (3).html` (an old copy of the site) and `scripts/` are excluded from deploys by `.vercelignore`.
- Eva's Expert Cleaning Services stays at `/cleaning/`, with its own canonical and content.
