---
title: 'Archives by Tag, Month, and Series: Clean URLs, A11y-Respecting Pagination'
date: '2026-08-25'
published: false
tags: ['architecture', 'static-site', 'seo', 'accessibility']
description: 'How dout.dev organizes posts into three orthogonal archives, the URL shape that keeps them shareable, and the pagination contract the templates inherit.'
canonical_url: false
---

## Three ways to slice the same posts

A blog is a time-ordered list of posts. That linear view is useful for the home page and the RSS feed. It is bad for discovery. Readers who arrive on a single post want a way to find more like it, and "more like it" is not a single axis.

dout.dev ships three archives:

- **By tag** — `/tags/<slug>.html`. Topical similarity. "Show me all the accessibility posts."
- **By month** — `/months/<YYYY-MM>.html`. Temporal browsing. "What did you write in 2026-03?"
- **By series** — `/series/<slug>.html`. Intentional groupings. "Read the making-of series in order."

Each is a first-class surface with its own page, its own RSS feed, its own OG image, and its own pagination. All three are generated from the same normalized dataset the post generator uses, so there is no drift between what a tag page shows and what the post pages claim.

## The URL shape

The URL contract is opinionated and consistent across the three archives.

- **Page 1 is flat.** `/tags/accessibility.html`, `/months/2026-08.html`, `/series/making-of.html`.
- **Pages 2+ live in a subfolder.** `/tags/accessibility/2/`, `/months/2026-08/2/`, `/series/making-of/2/`.

Why the split? Two reasons.

**Flat URLs for page 1 are canonical.** They are the URLs that show up in RSS feeds, sitemaps, and shares. They should look like leaves of a tree, not like indexes.

**Subfolders for pages 2+ prevent URL-pattern collision.** A URL like `/tags/accessibility/2.html` looks like it might be a post slug. `/tags/accessibility/2/` is unambiguously a paginated archive.

The templates in the repo enforce this. The paginator receives the scope and the page number and emits the URL based on these rules, not string-concatenated from an input.

## The pagination component, once

Pagination on an archive is the same pagination on the search page, which is the same pagination I will ship on any future list view. It lives in one component, `src/components/pagination.html`, and gets included.

```html
<include src="../components/pagination.html"></include>
```

The parent template exposes a `pagination` object with the shape:

```js
{
  current: 1,
  total: 3,
  baseUrl: '/tags/accessibility/',
  items: [
    { kind: 'prev', url: null, disabled: true },
    { kind: 'number', page: 1, url: '/tags/accessibility.html', current: true },
    { kind: 'number', page: 2, url: '/tags/accessibility/2/', current: false },
    { kind: 'number', page: 3, url: '/tags/accessibility/3/', current: false },
    { kind: 'next', url: '/tags/accessibility/2/', disabled: false },
  ],
}
```

The component renders that shape. Every archive and the search use it. One source of truth for styling, for accessibility, for behavior.

## `aria-current`, `rel="prev"` / `rel="next"`, and the ellipsis problem

Three small details that make pagination accessible and crawlable.

**`aria-current="page"` on the current page link.** Screen readers announce "current page, 2 of 5" instead of just "2." That is the correct value for pagination, as opposed to `aria-current="location"` which is what I use for scrollspy anchors.

**`rel="prev"` and `rel="next"` on the adjacent page links.** Crawlers use these to understand that the pages are part of a paginated sequence. Google has officially deprecated `rel="prev/next"` for Search, but other crawlers still respect it and the cost is nothing.

**Ellipses are not links.** When there are many pages, the pagination compresses with `...` markers. Those markers are `<span>`, not `<a>`. A keyboard user who tabs through pagination should not land on a non-interactive element, and a screen reader should skip them.

```html
<nav class="pagination" aria-label="Pagination">
  <a href="/tags/accessibility.html" rel="prev">Previous</a>
  <a href="/tags/accessibility.html">1</a>
  <a href="/tags/accessibility/2/" aria-current="page">2</a>
  <span aria-hidden="true">…</span>
  <a href="/tags/accessibility/5/">5</a>
  <a href="/tags/accessibility/3/" rel="next">Next</a>
</nav>
```

The `aria-label="Pagination"` on the `<nav>` is required because the page has more than one `<nav>` element (primary nav, post nav, archive pagination).

## Per-archive RSS

Each archive has its own RSS feed. `/tags/accessibility.xml` contains only posts tagged accessibility. Subscribers who care about one topic can follow it without seeing the rest.

```html
<link rel="alternate" type="application/rss+xml"
      title="dout.dev — accessibility"
      href="/tags/accessibility.xml" />
```

The feed is generated from the tag-filtered subset of the dataset. Same template, same pagination-less shape (RSS does not paginate), different inputs. About ten extra lines of generator code per archive type.

## The tag slug rules

Slugging is the kind of thing that looks trivial until it bites. The rules:

1. Lowercase.
2. Replace spaces with hyphens.
3. Strip punctuation except hyphens.
4. Collapse consecutive hyphens.
5. Strip leading and trailing hyphens.

```js
function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

The slug normalizer runs on every tag at CMS normalization time. Tags that slugify to the same value are merged with a warning in the build output. That prevents the "CSS" / "css" / "Css" tag fragmentation that happens without a rule.

## Series are different on purpose

Tags are unordered. Series are ordered. A series archive renders the posts in publication order, not reverse chronological, because the reader wants part 1 before part 2.

```js
if (archive.kind === 'series') {
  posts.sort((a, b) => a.date.localeCompare(b.date));
} else {
  posts.sort((a, b) => b.date.localeCompare(a.date));
}
```

That is a six-line difference in the generator. The templates do not need to know — they receive posts in the correct order and render them.

## The takeaway

Archives are a design surface, not a free byproduct of having tags. Decide the URL shape. Ship a single pagination component. Respect the accessibility details that keep pagination usable with a keyboard and a screen reader. Give each archive its own feed. The result is a blog that is actually discoverable, not just readable.

## References

- [Pagination with `rel="next"` and `rel="prev"` — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel)
- [`aria-current` — ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/#aria-current)
- [Sitemaps Protocol](https://www.sitemaps.org/protocol.html)
- [URL design — Kyle Neath](https://warpspire.com/posts/url-design/)
