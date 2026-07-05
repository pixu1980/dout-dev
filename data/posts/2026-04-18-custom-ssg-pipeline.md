---
title: 'Custom SSG Pipeline: From Markdown to Static HTML (Without Losing Your Mind)'
date: '2026-04-18'
published: true
tags: ['making-of', 'architecture', 'static-site', 'cms']
series: 'How I made it'
description: 'A walk through the dout.dev static site generator: scan, normalize, render, emit, and keep the moving parts small. Like a tiny, well-behaved factory.'
canonical_url: false
---

## The pipeline, in one picture (because I know you're skimming)

Everything starts in `data/posts/`. Each post is a markdown file with YAML front matter. The build is four stages, in this exact order, no jumping around:

1. **Scan.** Read every markdown file, parse front matter, validate required fields. Yell if something's missing.
2. **Normalize.** Compute slug, excerpt, keywords, reading time, canonical URL, tag and month and series indexes. This is where the thinking happens.
3. **Render.** Convert markdown to HTML, pass the normalized dataset and per-page context into the template engine, write files under `src/`.
4. **Emit.** Generate feeds, sitemap, search indexes, and OG images.

**The pipeline is a plain Node script** orchestrated from `scripts/cms/build.js`. No framework, no plugin system, no watcher magic outside of a small `cms:watch` entry point. It's just a script. Like god intended.

## Stage 1: scan (the boring part, on purpose)

The scan step reads the directory and returns an array of raw post records. It's the thinnest possible layer: one call to `gray-matter` per file, a sanity check on required fields, and a sort by date. That's it. Nothing fancy.

What the scan does NOT do is also important: no rendering, no side effects, no cross-post computation. If the scan fails, it fails loud, at one file, with a clear message. That makes debugging content errors a five-second loop instead of a "where the fuck did I put my breakpoint" expedition.

## Stage 2: normalize (where the magic happens, and by magic I mean math)

Normalization is where most of the thinking happens. Given the raw post records, it produces:

- a stable slug per post, derived from the filename, with a predictable URL;
- an excerpt and a keyword set, computed from the rendered body (after a first pass of markdown);
- the tag index, the month index, and the series index, each with counts and canonical slugs;
- the next/previous pointers for each post;
- the pagination plan for every listing view.

This step is deliberately pure. Given the same inputs it returns the same outputs. Pure functions are like a warm blanket: predictable, safe, and they don't surprise you at 2 AM.

## Stage 3: render (where the files happen)

The renderer walks the normalized dataset and writes files. For each post it renders the post page. For each tag, month, and series it renders the listing page and, if needed, subsequent paginated pages at `/{scope}/{slug}/{n}/`. It also renders the home, archive, about, playground, offline, and 404 pages.

The template engine is small and understands four things: extending a base layout, declaring blocks, including fragments, and evaluating expressions with filters. There is no virtual DOM, no hydration layer, no partial rendering. The output is HTML. Just HTML. Like a caveman.

The renderer is where the editorial shape of the site is visible. Every view is a template that describes a real document, not a component tree that happens to serialize to HTML. You can open the generated `src/posts/*.html` and read it like a normal document. That's the property I wanted: the output should be readable by a human who has never heard of my build pipeline.

## Stage 4: emit (the cherry on top)

The final stage produces everything that is derived but not a page:

- `feed.rss`, `feed.json`, `feed.xml` for subscribers;
- `sitemap.xml` for crawlers;
- `src/data/*.json` for the client-side search index;
- `src/assets/og/posts/*.png` for social previews.

OG images are worth their own post; they are rendered server-side at build time from an SVG template and rasterized with Sharp. That one decision — "generate them at build, never at runtime" — eliminated an entire category of infrastructure I did not want to maintain. No runtime image service. No cloud function. No fucking around.

## Why the pipeline stays small (the discipline part)

Three constraints keep the code honest:

**One pass, no hidden passes.** Every derivation lives in the normalize step. The renderer never computes global state. The emitter never reaches back into the renderer. The dataset flows in one direction. Like a good Unix pipe.

**No dynamic content at runtime.** Everything that can be precomputed IS precomputed. The only thing running in the browser is the small progressive-enhancement layer: theme switching, search over the prebuilt indexes, scrollspy, and the Giscus comments.

**No framework to appease.** There are no "pages" folders, no special file-based routing rules, no magic exports. Every page exists because a script wrote it. No magic. No convention-over-configuration bullshit.

The result is a build that runs in under a few seconds on a cold cache and is cheap enough that I never think about it. The pipeline is small enough to read end-to-end in an afternoon. Try that with your Next.js app.

## What's next

The next post in this series goes into how `extends`, `block`, `include`, and the expression grammar work without `eval` — and why the grammar is close to HTML instead of curly-brace syntax. Stay tuned, or don't. I'm writing it either way.
