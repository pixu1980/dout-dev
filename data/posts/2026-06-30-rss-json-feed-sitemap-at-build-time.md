---
title: 'RSS + JSON Feed + Sitemap at Build Time: the Distribution Minimum'
date: '2026-06-30'
published: false
tags: ['seo', 'static-site', 'architecture']
description: 'The three distribution files every blog should ship, how I generate them at build time on dout.dev, and why the JSON Feed is not a curiosity.'
canonical_url: false
---

## The distribution minimum

A blog that does not ship feeds and a sitemap is a blog that nobody can reliably subscribe to, and a blog that crawlers have to guess at. Both problems are fixed with three files:

- `feed.rss` for classic RSS readers;
- `feed.json` for modern readers that prefer JSON Feed;
- `sitemap.xml` for crawlers.

On dout.dev all three are generated at build time from the same normalized dataset the page generator uses. No external tooling. No runtime hit.

## RSS 2.0 is still the lingua franca

Despite being old, RSS remains the format that every reader supports. If you ship exactly one feed, ship RSS. The schema is tiny and the templating is a for-loop.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>dout.dev</title>
    <link>https://dout.dev</link>
    <description>Vanilla-first static blog on web standards and AI-assisted engineering.</description>
    <language>en-us</language>
    <lastBuildDate>Mon, 30 Jun 2026 08:00:00 GMT</lastBuildDate>
    <atom:link href="https://dout.dev/feed.rss" rel="self" type="application/rss+xml" />

    <item>
      <title>RSS + JSON Feed + Sitemap at Build Time</title>
      <link>https://dout.dev/posts/2026-06-30-rss-json-feed-sitemap-at-build-time.html</link>
      <guid isPermaLink="true">https://dout.dev/posts/2026-06-30-rss-json-feed-sitemap-at-build-time.html</guid>
      <pubDate>Tue, 30 Jun 2026 08:00:00 GMT</pubDate>
      <description><![CDATA[The three distribution files every blog should ship…]]></description>
    </item>
  </channel>
</rss>
```

Two things are easy to get wrong here.

**The `lastBuildDate` and `pubDate` must be RFC 822.** Not ISO. Not "a date." RFC 822 with a four-digit year is the correct shape. Readers will silently drop items that do not parse.

**The `<atom:link rel="self">` is not optional.** It is the self-reference that tells aggregators where the feed lives. Some validators treat it as a warning; some treat it as a bug; some readers ignore it. Ship it.

## JSON Feed is not a curiosity

JSON Feed is worth shipping alongside RSS. The format is human-readable, trivial to parse, and the spec is under one screen. Readers like NetNewsWire and Readwise speak it natively.

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "dout.dev",
  "home_page_url": "https://dout.dev",
  "feed_url": "https://dout.dev/feed.json",
  "language": "en-US",
  "items": [
    {
      "id": "https://dout.dev/posts/2026-06-30-rss-json-feed-sitemap-at-build-time.html",
      "url": "https://dout.dev/posts/2026-06-30-rss-json-feed-sitemap-at-build-time.html",
      "title": "RSS + JSON Feed + Sitemap at Build Time",
      "date_published": "2026-06-30T08:00:00Z",
      "summary": "The three distribution files every blog should ship…",
      "tags": ["seo", "static-site", "architecture"]
    }
  ]
}
```

The cost of adding it is an extra file and twenty lines of generator code. The benefit is any reader that speaks JSON Feed gets richer metadata — tags, summaries, author — without the ceremony of extension namespaces in XML.

## Sitemap: every URL or no URL

The sitemap is for crawlers. If you ship it, ship everything. Partial sitemaps are worse than no sitemap because they implicitly tell the crawler "these are the interesting pages," which de-weights everything not listed.

The dout.dev sitemap includes posts, tag pages, month archives, series archives, the home page, the about page, and the search page. It does not include the 404, the offline page, or the playground.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dout.dev/</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://dout.dev/posts/2026-06-30-rss-json-feed-sitemap-at-build-time.html</loc>
    <lastmod>2026-06-30</lastmod>
  </url>
  <!-- … -->
</urlset>
```

The `changefreq` and `priority` fields are advisory. Google has said publicly that it mostly ignores them. I still ship them because other crawlers read them and the cost is nothing.

## Per-tag and per-month RSS, for people who want it

An underrated feature: each tag page and each month archive on dout.dev has its own RSS feed. A reader who cares about `accessibility` but not about `css` can subscribe to `/tags/accessibility.xml` and never see a post outside that tag.

The feeds are generated from the same dataset as the main feed, filtered to the tag or month. It is free to produce, because the normalized data already has the tag and month indexes.

```html
<link rel="alternate" type="application/rss+xml"
      title="dout.dev — accessibility"
      href="/tags/accessibility.xml" />
```

That `<link rel="alternate">` is how readers auto-discover the feed. Every tag page ships it.

## The build-time angle

None of this happens at runtime. The feeds and sitemap are generated when the CMS builds, committed as artifacts in `dist/`, and served as plain static files by GitHub Pages. That means:

- No feed service to maintain.
- No cache invalidation problem.
- No rate limiting, no throttling, no 500 errors on publish spikes.
- The feed is always consistent with the site it describes, because they come from the same build.

## The takeaway

Shipping RSS, JSON Feed, and a sitemap is an afternoon of generator code. The payoff is measurable: crawlers find your content, readers subscribe, and the blog stops being a black box to the rest of the web.

## References

- [RSS 2.0 Specification — RSS Advisory Board](https://www.rssboard.org/rss-specification)
- [JSON Feed v1.1 — JSON Feed](https://www.jsonfeed.org/version/1.1/)
- [Sitemaps Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Central: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [W3C Feed Validation Service](https://validator.w3.org/feed/)
