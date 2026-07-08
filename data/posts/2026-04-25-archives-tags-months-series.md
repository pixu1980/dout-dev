---
title: 'Archives, Tags, Months, and Series (Or: How I Learned to Stop Worrying and Love Pagination)'
date: '2026-04-25'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'archives', 'seo', 'accessibility']
series: 'How I made it'
description: 'How dout.dev organizes posts into clean archive URLs, accessible pagination, tag pages, month pages, and series pages. Yes, pagination can be accessible.'
canonical_url: false
---

## Three ways to slice the same posts (because one axis is never enough)

A blog is a time-ordered list of posts. That linear view is useful for the home page and the RSS feed. It's terrible for discovery. Readers who arrive on a single post want a way to find more like it, and "more like it" is NOT a single axis. Anyone who tells you otherwise has never watched their analytics.

dout.dev ships three archives:

- **By tag** - `/tags/<slug>.html`. Topical similarity. "Show me all the accessibility posts."
- **By month** - `/months/<YYYY-MM>.html`. Temporal browsing. "What did you write in January 2026?"
- **By series** - `/series/<slug>.html`. Intentional groupings. "Read the making-of series in order, you animal."

**Each is a first-class surface** with its own page, its own RSS feed, its own OG image, and its own pagination. All three are generated from the same normalized dataset the post generator uses, so there is zero drift between what a tag page shows and what the post pages claim. Consistency is a feature.

## The URL shape (opinionated as fuck)

The URL contract is opinionated and consistent across the three archives. Because URL design matters and anyone who says otherwise is wrong.

- **Page 1 is flat.** `/tags/accessibility.html`, `/months/2026-08.html`, `/series/making-of.html`.
- **Pages 2+ live in a subfolder.** `/tags/accessibility/2/`, `/months/2026-08/2/`, `/series/making-of/2/`.

Why the split? Two reasons. Both good.

**Flat URLs for page 1 are canonical.** They are the URLs that show up in RSS feeds, sitemaps, and shares. They should look like leaves of a tree, not like indexes. `/tags/accessibility.html` is a page about accessibility. `/tags/accessibility/2/` is page 2 of that list.

**Subfolders for pages 2+ prevent URL-pattern collision.** A URL like `/tags/accessibility/2.html` looks like it might be a post slug. `/tags/accessibility/2/` is unambiguously a paginated archive. No ambiguity. No confusion.

The templates in the repo enforce this. The paginator receives the scope and the page number and emits the URL based on these rules, not string-concatenated from user input.

## The pagination component, once (DRY for real)

Pagination on an archive is the same pagination on the search page, which is the same pagination I will ship on any future list view. It lives in ONE component, `src/components/pagination.html`, and gets included.

```html
<include src="../components/pagination.html"></include>
```

The parent template exposes a `pagination` object with a well-defined shape. The component renders that shape. Every archive and the search use it. One source of truth for styling, for accessibility, for behavior.

If you have three different pagination implementations in your codebase, stop reading and go refactor. I'll wait.

## `aria-current`, `rel="prev"` / `rel="next"`, and the ellipsis problem

Three small details that make pagination accessible and crawlable. Small details matter.

**`aria-current="page"` on the current page link.** Screen readers announce "current page, 2 of 5" instead of just "2." That's the correct value for pagination, as opposed to `aria-current="location"` which is what I use for scrollspy anchors.

**`rel="prev"` and `rel="next"` on the adjacent page links.** Crawlers use these to understand that the pages are part of a paginated sequence. Google has officially deprecated `rel="prev/next"` for Search, but other crawlers still respect it and the cost is nothing. Zero. Nada.

**Ellipses are NOT links.** When there are many pages, the pagination compresses with `...` markers. Those markers are `<span>`, not `<a>`. A keyboard user who tabs through pagination should not land on a non-interactive element, and a screen reader should skip them. This is the kind of detail that separates "I care about accessibility" from "I have an axe-core badge."

## Per-archive RSS (because feeds are not dead)

Each archive has its own RSS feed. `/tags/accessibility.xml` contains ONLY posts tagged accessibility. Subscribers who care about one topic can follow it without seeing the rest.

```html
<link rel="alternate" type="application/rss+xml" title="dout.dev - accessibility" href="/tags/accessibility.xml" />
```

The feed is generated from the tag-filtered subset of the dataset. Same template, same pagination-less shape (RSS does not paginate), different inputs. About ten extra lines of generator code per archive type. Best ROI ever.

## The tag slug rules (because someone will write "C.S.S." and break everything)

Slugging is the kind of thing that looks trivial until it bites you in the ass. The rules:

1. Lowercase.
2. Replace spaces with hyphens.
3. Strip punctuation except hyphens.
4. Collapse consecutive hyphens.
5. Strip leading and trailing hyphens.

```js
function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

The slug normalizer runs on every tag at CMS normalization time. Tags that slugify to the same value are merged with a warning in the build output. That prevents the "CSS" / "css" / "Css" tag fragmentation that happens without a rule.

## Series are different on purpose (chronological order matters)

Tags are unordered. Series are ORDERED. A series archive renders the posts in publication order, not reverse chronological, because the reader wants part 1 BEFORE part 2. Revolutionary concept, I know.

```js
if (archive.kind === 'series') {
  posts.sort((a, b) => a.date.localeCompare(b.date));
} else {
  posts.sort((a, b) => b.date.localeCompare(a.date));
}
```

That's a six-line difference in the generator. The templates do not need to know - they receive posts in the correct order and render them.

## The takeaway (stop skimming and read this)

Archives are a design surface, not a free byproduct of having tags. Decide the URL shape. Ship a single pagination component. Respect the accessibility details that keep pagination usable with a keyboard and a screen reader. Give each archive its own feed. The result is a blog that is actually discoverable, not just readable.
