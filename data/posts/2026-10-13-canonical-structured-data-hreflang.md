---
title: 'Canonical, Structured Data, Hreflang: SEO Without Cargo Culting'
date: '2026-10-13'
published: false
tags: ['seo', 'architecture', 'html']
description: 'The SEO tags that actually do work on a static blog: canonical URLs, JSON-LD structured data, and hreflang when it applies. What I ship, what I skip, why.'
canonical_url: false
---

## The short version

"SEO" is a category name. Inside it are a dozen unrelated concerns, some of which matter for most sites and many of which do not. This post is the handful of tags I ship on dout.dev because they demonstrably help crawlers and discovery, and the handful I do not ship because they are noise.

The line I draw: a tag earns its place if a major crawler uses it or if it improves a demonstrable discovery behavior. If it is "recommended" but nobody can point to the behavior it improves, I leave it out.

## Canonical URLs: one real URL per page

Every page on dout.dev has a canonical URL in the head.

```html
<link rel="canonical" href="https://dout.dev/posts/2026-10-13-canonical-structured-data-hreflang.html" />
```

The value is the absolute URL of the page as it lives on the site. Three rules:

1. **Always absolute.** Relative canonicals work but are ambiguous in practice.
2. **Always HTTPS.** Never redirect through HTTP; the canonical declares HTTPS directly.
3. **Self-referential on normal pages.** A post's canonical points at itself. An archive's canonical points at itself.

Where canonical matters most is when the same content is reachable via multiple URLs. Pagination is the classic case: `/tags/accessibility/2/` should still canonical to itself, not to `/tags/accessibility/`. Search result pages, query-string variations, and session-id URLs are the other common cases.

On a clean static site with one URL per page, canonical is mostly boilerplate. It is still worth shipping, because the day a duplicate URL appears (through a short-link service, a Mastodon share, a paginated archive), the canonical is the difference between a clean index and content fragmentation.

## Structured data: JSON-LD for articles

JSON-LD is the format Google, Bing, and LinkedIn want for structured data. It is a `<script type="application/ld+json">` block in the head.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Canonical, Structured Data, Hreflang: SEO Without Cargo Culting",
  "description": "The SEO tags that actually do work on a static blog…",
  "datePublished": "2026-10-13",
  "author": {
    "@type": "Person",
    "name": "Emiliano \"pixu1980\" Pisu",
    "url": "https://dout.dev/about.html"
  },
  "image": "https://dout.dev/assets/og/posts/2026-10-13-canonical-structured-data-hreflang.png",
  "publisher": {
    "@type": "Organization",
    "name": "dout.dev",
    "url": "https://dout.dev"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://dout.dev/posts/2026-10-13-canonical-structured-data-hreflang.html"
  }
}
</script>
```

That block earns its place because:

- **Google Discover** uses it to decide whether a post is article content.
- **Mastodon, Slack, and some RSS readers** enrich link previews when structured data is present.
- **Google Search Console** reports structured data errors, which means the build can be verified.

The post generator emits this block from the normalized post record. One source, per-post substitution, no manual upkeep.

## What I do not ship as structured data

`WebSite` with `SiteNavigationElement`, `BreadcrumbList` on posts that have no breadcrumb UI, `Article` alongside `BlogPosting`, `@type` schemas for which no consumer has a documented behavior.

The heuristic: if I cannot point at a concrete consumer behavior, I do not ship the schema. "Might help ranking someday" is not a reason. Schema spam has a negative cost with some crawlers, which explicitly penalize sites that dump irrelevant structured data.

## Hreflang: only when it applies

`hreflang` tells crawlers which language a page is in and what the equivalents are in other languages.

```html
<link rel="alternate" hreflang="en-US" href="https://dout.dev/posts/…" />
<link rel="alternate" hreflang="it-IT" href="https://dout.dev/it/posts/…" />
<link rel="alternate" hreflang="x-default" href="https://dout.dev/posts/…" />
```

dout.dev is English only. The roadmap removed the i18n milestone. So hreflang is a no-op for my case and I do not ship it. Writing it out here for completeness: the moment a site has localized content, hreflang is non-optional, and omitting it is a real SEO hit.

The `x-default` row is the one most people miss. It tells crawlers which URL to serve when no language matches. Without it, a user on a Swahili browser with no Swahili translation gets the first-listed alternate, which may or may not be what you want.

## Open Graph and Twitter Cards

These are not strictly SEO, but they are discovery. Every post has:

```html
<meta property="og:site_name" content="dout.dev" />
<meta property="og:type" content="article" />
<meta property="og:title" content="…" />
<meta property="og:description" content="…" />
<meta property="og:url" content="…" />
<meta property="og:image" content="…" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="en_US" />
<meta property="article:published_time" content="2026-10-13" />

<meta name="twitter:card" content="summary_large_image" />
```

The `og:image:width` and `og:image:height` are not optional in practice; Mastodon's preview system, in particular, falls back to a smaller thumbnail without them.

`twitter:card` is one of the rare "Twitter-specific" tags still worth shipping. Once set, both Twitter and X parse it reliably; omitting it sometimes degrades the card to a small summary.

## The robots and meta pragmas that matter

```html
<meta name="robots" content="index,follow" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

`robots` is explicit by default on the posts; the home page and archive have the same value. Drafts (`published: false`) never render, so there is no need for a `noindex` path for them.

`referrer` is a privacy choice. It tells the browser how much referrer information to send when the user clicks a link off-site. `strict-origin-when-cross-origin` is the reasonable default: same-origin gets the full URL, cross-origin gets only the origin, and HTTP→HTTPS downgrade suppresses it entirely.

## What I learned from watching crawler behavior

Two findings from the first months after publishing.

**Canonical works, but only after the crawler re-crawls.** A short-link that 301s to your canonical URL may still show up in Search Console as a separate URL for days before it merges. The canonical is correct; the crawl index is eventually consistent.

**Structured data errors are loud.** Google Search Console pings you within days if the JSON-LD is malformed. Fixing it is a round trip; the build-time validation is worth adding so errors are caught before deploy.

## The takeaway

SEO on a blog is not magic. Three tags — canonical, structured data, Open Graph — cover most of the actual behavior. Hreflang only when you have multiple languages. Skip the dozens of "recommended" tags unless you can point at the consumer behavior they enable. The goal is a clean, honest document, not a holiday tree of meta tags.

## References

- [Canonical URLs — Google Search Central](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
- [Structured data general guidelines — Google](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Schema.org — BlogPosting](https://schema.org/BlogPosting)
- [Hreflang guide — Google](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Open Graph protocol](https://ogp.me/)
- [JSON-LD Playground](https://json-ld.org/playground/)
