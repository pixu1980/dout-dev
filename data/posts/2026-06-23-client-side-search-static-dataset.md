---
title: 'Client-Side Search on a Static Dataset: Prebuilt Index, Light Ranking'
date: '2026-06-23'
published: false
tags: ['vanilla-js', 'search', 'architecture', 'static-site']
description: 'How dout.dev ships a search experience without a backend: prebuilt JSON indexes, a light ranking function, URL-driven filters and pagination.'
canonical_url: false
---

## The constraint

A static blog has no backend. That is the whole point. So search has to satisfy three rules:

1. No server. No Algolia, no Lunr-as-a-service, no runtime dependency.
2. Small payload. A reader who never opens the search page should pay nothing.
3. Real results. Not just title contains-term. Tags, keywords, and series should rank too.

On dout.dev this shipped as a single `search.html` page that loads prebuilt JSON indexes from `/data/`, runs a light ranking function in the browser, and paginates the results. Total client code is under 200 lines.

## The indexes are built at the CMS step

Every time the CMS runs, it emits four files under `src/data/`:

- `posts.json` — one entry per published post: title, slug, date, description, tags, series, keywords extracted from the body;
- `tags.json` — one entry per tag: label, slug, count;
- `months.json` — one per month: `YYYY-MM`, count;
- `series.json` — one per series: label, slug, count.

A post entry looks like this:

```json
{
  "slug": "2026-05-19-html-native-template-engine",
  "title": "An HTML-Native Template Engine Without eval()",
  "date": "2026-05-19",
  "description": "How the dout.dev template engine handles extends, blocks…",
  "tags": ["architecture", "vanilla-js", "frontend"],
  "series": null,
  "keywords": ["template", "engine", "extends", "blocks", "eval", "sandbox"]
}
```

The `keywords` array is computed from the body during the build: frequent, informative tokens the reader would plausibly search for. The ranker uses them later for query-term boosting.

## The query layer: URL-driven

The search page reads everything from the URL. That makes results shareable, bookmarkable, and back-button friendly.

```
/search.html?q=template&type=post&type=tag&page=2
```

- `q` is the query term.
- `type` is repeatable and filters the result stream (post, tag, series, month).
- `page` is the pagination index, 1-based.

Any change to the form updates the URL via `history.pushState`. No framework. No state library.

```js
function updateUrl({ q, types, page }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  for (const t of types) params.append('type', t);
  if (page > 1) params.set('page', String(page));
  const next = `${location.pathname}?${params.toString()}`;
  history.pushState({}, '', next);
}
```

## The ranker

The ranker is deliberately simple. A weighted sum of term hits against different fields, a small boost for exact keyword match, a tiny recency tilt.

```js
function scorePost(post, tokens) {
  const title = post.title.toLowerCase();
  const desc = post.description.toLowerCase();
  const tagString = post.tags.join(' ').toLowerCase();
  const kwSet = new Set(post.keywords);

  let score = 0;
  for (const t of tokens) {
    if (title.includes(t)) score += 5;
    if (desc.includes(t)) score += 2;
    if (tagString.includes(t)) score += 3;
    if (kwSet.has(t)) score += 4;
  }

  // Light recency nudge: newer posts win ties
  const days = (Date.now() - new Date(post.date).getTime()) / 86400000;
  score += Math.max(0, 1 - days / 3650);

  return score;
}
```

This is not Elasticsearch. It is a heuristic that works well when the corpus is a few dozen posts. I would not use it for ten thousand entries. For a blog, it is the right size of tool.

## Pagination and announcement

Results are paginated 10 at a time on the client. The pagination component matches the server-rendered archive pagination: `rel="prev"` / `rel="next"`, `aria-current="page"` on the active page, ellipses that are not clickable.

The results summary uses `aria-live="polite"` so that screen readers hear the new result count when the query changes, without stealing focus.

```html
<p class="results-summary" aria-live="polite" role="status">
  7 results for "template". Page 1 of 1.
</p>
```

That single attribute is the whole accessibility story for live-updating results.

## What about fuzzy matching and typos?

I punted. The corpus is small enough that users who mistype a word can correct it faster than the algorithm could guess. If the blog grows past a few hundred posts I would revisit — probably with a trigram index built at the same CMS step.

The honest measurement is: on a corpus the size of dout.dev, exact-term search with field weighting is indistinguishable from fancier solutions in user satisfaction, and it costs a fraction of the bytes.

## What it does not do, and why that is fine

- **No search-as-you-type with network calls.** Every keystroke scores against the in-memory dataset, which is already loaded.
- **No analytics on queries.** The site analytics are page hits only (no cookies), and search is intentionally out of scope.
- **No autocomplete.** It could be added with the same dataset and twenty more lines. I did not need it.

## The takeaway

A static site can have a good search without a service. Build the indexes when you build the site. Load them on the search page only. Write a ranking function that matches your corpus. Drive it from the URL. That is the whole story, and the client code fits on a page.

## References

- [URLSearchParams — MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [History API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [Live regions — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [Lunr](https://lunrjs.com/) — if you outgrow the handwritten ranker
- [Pagefind](https://pagefind.app/) — a solid static-search option at the "many thousands of pages" scale
