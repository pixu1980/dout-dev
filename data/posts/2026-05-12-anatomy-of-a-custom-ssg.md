---
title: 'Anatomy of a Custom SSG: Markdown to Static HTML'
date: '2026-05-12'
published: false
tags: ['architecture', 'static-site', 'vanilla-js']
description: 'A walk through the dout.dev static site generator: how front matter becomes pages, archives, feeds, and OG images, and how the pieces stay small.'
canonical_url: false
---

## The pipeline, in one picture

Everything starts in `data/posts/`. Each post is a markdown file with YAML front matter. The build is four stages:

1. **Scan.** Read every markdown file, parse front matter, validate required fields.
2. **Normalize.** Compute slug, excerpt, keywords, reading time, canonical URL, tag and month and series indexes.
3. **Render.** Convert markdown to HTML, pass the normalized dataset and per-page context into the template engine, write files under `src/`.
4. **Emit.** Generate feeds, sitemap, search indexes, and OG images.

The pipeline is a plain Node script orchestrated from `scripts/cms/build.js`. No framework, no plugin system, no watcher magic outside of a small `cms:watch` entry point.

## Stage 1: scan

The scan step reads the directory and returns an array of raw post records. It is the thinnest possible layer: one call to `gray-matter` per file, a sanity check on required fields, and a sort by date.

What the scan does not do is also important: no rendering, no side effects, no cross-post computation. If the scan fails, it fails loud, at one file, with a clear message. That makes debugging content errors a five-second loop.

## Stage 2: normalize

Normalization is where most of the thinking happens. Given the raw post records, it produces:

- a stable slug per post, derived from the filename, with a predictable URL;
- an excerpt and a keyword set, computed from the rendered body (after a first pass of markdown);
- the tag index, the month index, and the series index, each with counts and canonical slugs;
- the next/previous pointers for each post;
- the pagination plan for every listing view.

This step is deliberately pure. Given the same inputs it returns the same outputs. That lets the page generator be a dumb renderer and lets the tests be boring.

## Stage 3: render

The renderer walks the normalized dataset and writes files. For each post it renders the post page. For each tag, month, and series it renders the listing page and, if needed, subsequent paginated pages at `/{scope}/{slug}/{n}/`. It also renders the home, archive, about, playground, offline, and 404 pages.

The template engine is small and understands four things: extending a base layout, declaring blocks, including fragments, and evaluating expressions with filters. There is no virtual DOM, no hydration layer, no partial rendering. The output is HTML.

The renderer is where the editorial shape of the site is visible. Every view is a template that describes a real document, not a component tree that happens to serialize to HTML. You can open the generated `src/posts/*.html` and read it like a normal document. That is the property I wanted.

## Stage 4: emit

The final stage produces everything that is derived but not a page:

- `feed.rss`, `feed.json`, `feed.xml` for subscribers;
- `sitemap.xml` for crawlers;
- `src/data/*.json` for the client-side search index;
- `src/assets/og/posts/*.png` for social previews.

OG images are worth their own post; they are rendered server-side at build time from an SVG template and rasterized with Sharp. That one decision — "generate them at build, never at runtime" — eliminated an entire category of infrastructure I did not want to maintain.

## Why the pipeline stays small

Three constraints keep the code honest:

**One pass, no hidden passes.** Every derivation lives in the normalize step. The renderer never computes global state. The emitter never reaches back into the renderer. The dataset flows in one direction.

**No dynamic content at runtime.** Everything that can be precomputed is precomputed. The only thing running in the browser is the small progressive-enhancement layer: theme switching, search over the prebuilt indexes, scrollspy, and the Giscus comments.

**No framework to appease.** There are no "pages" folders, no special file-based routing rules, no magic exports. Every page exists because a script wrote it.

The result is a build that runs in under a few seconds on a cold cache and is cheap enough that I never think about it. The pipeline is small enough to read end-to-end in an afternoon.

## What the next posts cover

The template engine deserves its own walkthrough — how extends, blocks, and expressions work without `eval`, and how I kept the grammar close to HTML. That is next week.
