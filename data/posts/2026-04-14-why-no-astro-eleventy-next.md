---
title: 'Why I Skipped Astro, Eleventy and Next.js (And Built My Own SSG Like a Goddamn Caveman)'
date: '2026-04-14'
published: true
tags: ['making-of', 'architecture', 'static-site']
series: 'How I made it'
description: 'A pragmatic comparison of mainstream static-site options against a handwritten SSG. I built my own. No, I''m not insane. Yes, there''s a reason.'
canonical_url: false
---

## The default answer and why I ignored it

If someone asks me today "what should I use for a personal developer blog," my answer is almost always Astro. It's a reasonable default. The ergonomics are good, the output is lean, the community is active, and the opinionated parts are mostly defensible. I'm not a monster.

For dout.dev, **I did not pick Astro. Not Eleventy, not Next.js, not Gatsby, not a goddamn thing.** I wrote a static site generator from scratch, on purpose, with intent, like a person who's been burned one too many times. This post is the honest accounting of why — not to argue the frameworks are wrong, but to explain when building your own pipeline is actually a reasonable choice rather than a vanity project.

## The three hidden costs of a framework for a blog

Frameworks are not free. The invoice just arrives late, with interest.

**Upgrade churn.** A blog is a ten-year project, not a two-sprint feature. Every framework I have ever used for a side project demanded a non-trivial migration every two to three years. The migrations are rarely hard; they are consistently annoying, like a dripping faucet. Multiply by the number of projects you maintain. Compare to plain markdown, HTML, and CSS, which have needed zero migrations for twenty goddamn years.

**Opinion bleed.** Frameworks encode opinions about routing, data fetching, layout composition, hydration, bundling. Most of those opinions are good. A few will collide with what you actually want, and the escape hatches are usually worse than the happy path. For a blog, I wanted opinions I already hold — about accessibility, about URL shapes, about progressive enhancement — not opinions a framework has about islands or React Server Components that will be deprecated by the time I finish writing this sentence.

**Runtime ballast.** Even "zero-JS-by-default" frameworks ship a non-trivial runtime once you add interactivity. For a blog that is mostly text, every kilobyte of framework JavaScript is paying for a feature I am not using. Users on slow networks pay for it twice. Users on mobile pay for it with battery. I'm not asking my readers to subsidize framework bloat.

None of these are deal-breakers. They are line items. For some projects the line items are fine. For this one, I wanted the invoice to be as short as possible.

## What I got by going custom (the "I'm not crazy" section)

I did not rebuild the world. I rebuilt a small, boring world where every component is easy to replace and every layer is under two hundred lines. Boring code doesn't wake you up at 3 AM.

The SSG is a markdown-to-HTML pipeline that emits posts, tag and month archives, series, paginated listings, RSS, JSON Feed, sitemap, and OG images. The template engine is a small one that reads templates extending a base layout and fills blocks. The CMS is a normalization step that reads front matter, derives slugs, builds indexes, and hands typed data to the page generator. The design system is a set of CSS custom properties and a few dozen components.

The total amount of code I maintain is small enough that I could rewrite the whole pipeline over a weekend if I needed to. That's the ceiling I wanted. That's the freedom of owning your shit.

## What it costs me (the honest part)

**No ecosystem.** No plugins, no content collections, no MDX components written by someone smarter. Whatever I need, I write. That's fine for a blog; it would NOT be fine for a product. If you're building a product, stop reading this and go use Astro.

**No free lunches.** The responsive image pipeline is mine. The OG image renderer is mine. The search index is mine. The pagination URLs, the `rel="next"` tags, the structured data — all of it mine. That's where the AI copilot paid for itself, because writing those from scratch without help would have been the kind of slog that kills side projects.

**No upgrade path.** When a web platform API becomes interesting, I integrate it myself. When a framework adds a feature I envy, I reimplement the interesting part and skip the bloat. It's more work. It's also more understanding.

## When to choose a framework anyway (because I'm not a zealot)

This post is not "frameworks are bad." They are often the right choice. I would reach for Astro or Eleventy when:

- the site will have more than one author, and the mental overhead of a custom system would tax contributors;
- the site is a product, not a blog, and plugin velocity matters;
- the time budget is days, not weeks, and the quality of the default output is acceptable;
- the project will be handed off to someone who did not build it;
- the feature surface includes anything I have never built before and do not want to learn.

None of those applied here. dout.dev is a personal editorial project with a single author who has opinions and time. And a mild case of "I'll do it myself" syndrome.

## The actual conclusion (read this if you read nothing else)

Pick the tool that matches the TEN-YEAR horizon of the thing you are building, not the ninety-minute horizon of the first post. For most people that points at Astro. For this project — single author, strong opinions, no migration budget — it pointed at a handful of scripts and a design system I own end-to-end.

If you are starting a blog today and you want to ship something this weekend, use Astro. If you want to understand every line that runs, build the pipeline yourself. Both are defensible. The mistake is building the pipeline when you wanted to ship, or picking a framework when you wanted to understand. Know which one you are, and act accordingly.
