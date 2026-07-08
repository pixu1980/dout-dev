---
title: 'SEO Metadata Without Rituals (Or: I Read 47 SEO Blog Posts So You Don''t Have To)'
date: '2026-05-16'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'seo', 'opengraph', 'html']
series: 'How I made it'
description: 'The canonical URLs, structured data, Open Graph tags, and crawler pragmas dout.dev ships, and what it skips. SEO is not magic.'
canonical_url: false
---

## The short version (TL;DR for the impatient)

"SEO" is a category name. Inside it are a dozen unrelated concerns, some of which matter for most sites and many of which do not. This post is the handful of tags I ship on dout.dev because they demonstrably help crawlers and discovery, and the handful I do NOT ship because they are noise.

**The line I draw:** a tag earns its place if a major crawler uses it or if it improves a demonstrable discovery behavior. If it is "recommended" but nobody can point to the behavior it improves, I leave it out.

## Canonical URLs: one real URL per page (not that hard)

Every page on dout.dev has a canonical URL in the head. Every single one. No exceptions.

```html
<link rel="canonical" href="https://dout.dev/posts/some-post.html" />
```

The value is the absolute URL of the page as it lives on the site. Three rules. Follow them.

1. **Always absolute.** Relative canonicals work but are ambiguous in practice. Don't be ambiguous.
2. **Always HTTPS.** Never redirect through HTTP; the canonical declares HTTPS directly.
3. **Self-referential on normal pages.** A post's canonical points at itself. An archive's canonical points at itself.

Where canonical matters most is when the same content is reachable via multiple URLs. Pagination is the classic case: `/tags/accessibility/2/` should still canonical to itself, not to `/tags/accessibility/`. On a clean static site with one URL per page, canonical is mostly boilerplate. It is still worth shipping, because the day a duplicate URL appears (through a short-link service, a Mastodon share, a paginated archive), the canonical is the difference between a clean index and content fragmentation.

## Structured data: JSON-LD for articles (the one that actually matters)

JSON-LD is the format Google, Bing, and LinkedIn want for structured data. It is a `<script type="application/ld+json">` block in the head.

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "datePublished": "...",
  "author": { "@type": "Person", "name": "..." },
  "image": "...",
  "publisher": { "@type": "Organization", "name": "dout.dev" }
}
```

That block earns its place because:

- **Google Discover** uses it to decide whether a post is article content.
- **Mastodon, Slack, and some RSS readers** enrich link previews when structured data is present.
- **Google Search Console** reports structured data errors, which means the build can be verified.

The post generator emits this block from the normalized post record. One source, per-post substitution, no manual upkeep.

## What I do NOT ship as structured data (say no to schema spam)

`WebSite` with `SiteNavigationElement`, `BreadcrumbList` on posts that have no breadcrumb UI, `Article` alongside `BlogPosting`, `@type` schemas for which no consumer has a documented behavior.

The heuristic: if I cannot point at a concrete consumer behavior, I do NOT ship the schema. "Might help ranking someday" is not a reason. Schema spam has a negative cost with some crawlers, which explicitly penalize sites that dump irrelevant structured data.

## Hreflang: only when it applies (it doesn't, for me)

`hreflang` tells crawlers which language a page is in and what the equivalents are in other languages. dout.dev is English only. The roadmap removed the i18n milestone. So hreflang is a no-op for my case and I do not ship it.

Writing it out here for completeness: the moment a site has localized content, hreflang is non-optional, and omitting it is a real SEO hit.

## Open Graph and Twitter Cards (the preview matters)

These are not strictly SEO, but they are discovery. Every post has the full set: `og:site_name`, `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, `article:published_time`, `twitter:card`.

The `og:image:width` and `og:image:height` are NOT optional in practice. Mastodon's preview system, in particular, falls back to a smaller thumbnail without them. Ask me how I know.

## The robots and meta pragmas that matter (keep it tight)

```html
<meta name="robots" content="index,follow" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

Drafts (`published: false`) never render, so there is no need for a `noindex` path for them. `referrer` is a privacy choice.

## The takeaway

SEO on a blog is not magic. Three tags - canonical, structured data, Open Graph - cover most of the actual behavior. Hreflang only when you have multiple languages. Skip the dozens of "recommended" tags unless you can point at the consumer behavior they enable.

The goal is a clean, honest document, not a Christmas tree of meta tags.
