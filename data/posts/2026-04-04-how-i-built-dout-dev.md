---
title: 'How I Built dout.dev (and why I did not use a framework like a normal person)'
date: '2026-04-04'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'architecture', 'static-site']
series: 'How I made it'
description: 'A technical walkthrough of how dout.dev goes from markdown to an accessible, publishable static blog. With swearing. Lots of swearing.'
pinned: true
canonical_url: false
---

## What the stack is, exactly (TL;DR: files + Node + blood)

dout.dev is: markdown files in `data/posts/`, each with YAML front matter; a Node build script that scans, normalizes, and renders HTML; a small custom template engine because I hate people; plain CSS with a two-layer token system because I'm not an animal; JavaScript that shows up *after* the page is already useful. No runtime, no framework, no server. One build command produces a `dist/` folder; GitHub Pages serves it. End of story.

**Every goddamn decision in the stack points at the same thing:** the site should be trivial to host, portable across the next ten years of tooling changes (yes, ten, not two sprints), and fast to build so the pipeline never gets in the way of writing.

## The pipeline, in one picture (because nobody gives a shit about the details)

The build is four stages, in this exact order:

1. **Scan.** Read every markdown file, parse front matter, validate required fields. Yell if something's missing.
2. **Normalize.** Compute slugs, excerpts, keywords, reading time, and the tag/month/series indexes.
3. **Render.** Convert markdown to HTML, fill templates, write files under `src/`.
4. **Emit.** Generate feeds, sitemap, search indexes, and OG images.

The pipeline runs in one direction. No circular dependency bullshit. No hidden passes. Adding a post means adding one file; the build figures out everything else like a well-trained autistic savant.

## The CMS layer (where complexity goes to die)

The CMS reads front matter, derives slugs, builds the tag/month/series datasets, computes next/previous pointers for each post, and produces typed normalized records the page generator can render without thinking. The markdown renderer also rewrites local image references into responsive `<picture>` elements with WebP sources, known dimensions, and lazy loading - the variants come from a prior Sharp pass that writes a manifest.

This is the layer where complexity lives so it *doesn't have to live in the browser*. Because the browser is already fucked up enough without us piling on.

## The template engine (A.K.A. why I wrote my own like a goddamn psychopath)

I wrote a template engine instead of adopting one. The reason: I wanted templates that look like HTML documents, not a programming language wearing HTML clothes. The grammar has four primitives - `extends`, `block`, `include`, and inline expressions with an optional filter pipeline. Control flow uses custom elements (`<if>`, `<for>`) that stay consistent with the angle-bracket context.

No `eval`. Expressions are parsed into a small AST and walked by an interpreter that only reads from the context object. Rendering is deterministic and side-effect-free. Just the way I like it: predictable, boring, working.

## CSS: tokens before anything else (even Jesus had tokens before dying)

The CSS starts with a flat set of primitive tokens - spacing scale, type scale, line heights, surfaces, focus ring - and a second layer of semantic aliases that components actually read. Components write `color: var(--color-fg)`, never a literal hex value. Theme switching flips the semantic layer at the root; every component picks it up for free. Like magic, but with CSS variables.

The dark theme, light theme, and accent color switching are under fifty lines of custom property definitions. No Sass. No CSS-in-JS. No bullshit.

## Accessibility as a first-class build output (don't be a dick to disabled people)

Accessibility was a *milestone constraint*, not a final audit. Posts have focusable headings with stable `id`s, a sidebar outline synchronized with scroll, skip-links, `aria-current` on pagination, and a Playwright/axe-core check on every generated page that blocks the deploy if it fails.

The markup is semantic *before* ARIA shows up. When ARIA does appear - `aria-live` on search results, `aria-expanded` on disclosure buttons - it's because native HTML genuinely doesn't cover the case. Not because it's trendy.

## Progressive enhancement as a testable contract (I swear to god it works without JS)

Every page renders and navigates without JavaScript. The build verifies this with a Playwright check that runs key pages with JS disabled and asserts the core content is present. It's a contract. It's falsifiable. Try it.

Interactive features follow one rule: any UI element that requires JavaScript starts `hidden` in the markup and is revealed by the enhancement script. The theme toggle, the copy button on code blocks, the scrollspy - none of them exist in the DOM until the script that powers them runs. Sounds extreme. It's actually just proper fucking engineering.

## What a complete build produces (the stuff that comes out)

- Posts, tag archives, month archives, and series archives - each with their own pagination and per-archive RSS feed
- RSS 2.0, JSON Feed 1.1, sitemap.xml
- OG images (1200×630 PNGs) for every post and archive, generated from an SVG template rasterized with Sharp
- Responsive image variants and the manifest the renderer uses to emit `<picture>` elements
- A search index consumed client-side

One build command. One `dist/` folder. Zero runtime dependencies. Like the good old days, when websites were websites and not applications pretending to be websites.
