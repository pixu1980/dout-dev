---
title: 'Feeds and Sitemaps at Build Time (RSS Is Dead, Long Live RSS. Also JSON Feed.)'
date: '2026-05-09'
published: true
tags: ['making-of', 'feeds', 'seo', 'static-site']
series: 'How I made it'
description: 'How dout.dev generates RSS, JSON Feed, sitemap, and archive distribution files during the static build. Because feeds are not dead, you are just lazy.'
canonical_url: false
---

## The distribution minimum (three files, that's it)

A blog that does not ship feeds and a sitemap is a blog that nobody can reliably subscribe to, and a blog that crawlers have to guess at. Both problems are fixed with three files:

- `feed.rss` for the greybeards who still use actual RSS readers (I love you people);
- `feed.json` for the modern readers who prefer JSON Feed (I also love you);
- `sitemap.xml` for crawlers (I tolerate you).

On dout.dev **all three are generated at build time** from the same normalized dataset the page generator uses. No external tooling. No runtime hit. No excuses.

## RSS 2.0 is still the lingua franca (yes, in 2026)

Despite being old enough to drink in most countries, RSS remains the format that every reader supports. If you ship exactly one feed, ship RSS. The schema is tiny and the templating is a for-loop.

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
      <title>How Feeds Work at Build Time</title>
      <link>https://dout.dev/posts/feeds.html</link>
      <guid isPermaLink="true">https://dout.dev/posts/feeds.html</guid>
      <pubDate>Tue, 30 Jun 2026 08:00:00 GMT</pubDate>
      <description><![CDATA[The three distribution files every blog should ship...]]></description>
    </item>
  </channel>
</rss>
```

Two things are easy to get wrong here. Don't get them wrong.

**The `lastBuildDate` and `pubDate` must be RFC 822.** Not ISO. Not "a date." RFC 822 with a four-digit year is the correct shape. Readers will silently drop items that do not parse. I learned this the hard way so you don't have to.

**The `<atom:link rel="self">` is not optional.** It is the self-reference that tells aggregators where the feed lives. Some validators treat it as a warning; some treat it as a bug; some readers ignore it. Ship it anyway.

## JSON Feed is not a curiosity (it actually rocks)

JSON Feed is worth shipping alongside RSS. The format is human-readable, trivial to parse, and the spec is under one screen. Readers like NetNewsWire and Readwise speak it natively.

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "dout.dev",
  "home_page_url": "https://dout.dev",
  "feed_url": "https://dout.dev/feed.json",
  "items": [
    {
      "id": "https://dout.dev/posts/some-post.html",
      "url": "https://dout.dev/posts/some-post.html",
      "title": "Feeds at Build Time",
      "date_published": "2026-06-30T08:00:00Z",
      "tags": ["seo", "static-site"]
    }
  ]
}
```

The cost of adding it is an extra file and twenty lines of generator code. The benefit is any reader that speaks JSON Feed gets richer metadata — tags, summaries, author — without the ceremony of extension namespaces in XML. Twenty lines. Do it.

## Sitemap: every URL or no URL (pick one)

The sitemap is for crawlers. If you ship it, ship EVERYTHING. Partial sitemaps are worse than no sitemap because they implicitly tell the crawler "these are the interesting pages," which de-weights everything not listed.

The dout.dev sitemap includes posts, tag pages, month archives, series archives, the home page, the about page, and the search page. It does NOT include the 404, the offline page, or the playground.

The `changefreq` and `priority` fields are advisory. Google has said publicly that it mostly ignores them. I still ship them because other crawlers read them and the cost is nothing. Zero-cost optional metadata is always a yes.

## Per-tag and per-month RSS (for people who give a shit about one topic)

An underrated feature: each tag page and each month archive on dout.dev has its own RSS feed. A reader who cares about `accessibility` but not about `css` can subscribe to `/tags/accessibility.xml` and never see a post outside that tag.

The feeds are generated from the same dataset as the main feed, filtered to the tag or month. It is free to produce, because the normalized data already has the tag and month indexes. Free as in beer and free as in effort.

```html
<link rel="alternate" type="application/rss+xml" title="dout.dev - accessibility" href="/tags/accessibility.xml" />
```

That `<link rel="alternate">` is how readers auto-discover the feed. Every tag page ships it. Every month page ships it. No exceptions.

## The build-time angle (the part that actually matters)

None of this happens at runtime. The feeds and sitemap are generated when the CMS builds, committed as artifacts in `dist/`, and served as plain static files by GitHub Pages. That means:

- No feed service to maintain.
- No cache invalidation problem.
- No rate limiting, no throttling, no 500 errors on publish spikes.
- The feed is always consistent with the site it describes, because they come from the same build.

This is the elegance of static sites: everything is a file. Your feed is a file. Your sitemap is a file. Your images are files. Your pages are files. Files don't crash.

## The takeaway

Shipping RSS, JSON Feed, and a sitemap is an afternoon of generator code. The payoff is measurable: crawlers find your content, readers subscribe, and the blog stops being a black box to the rest of the web. If your blog doesn't have feeds in 2026, fix that before you write another post.
