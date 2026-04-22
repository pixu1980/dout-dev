---
title: 'One Year of dout.dev Rebuilt: Numbers, Mistakes, What I Would Redo'
date: '2026-11-17'
published: false
tags: ['making-of', 'retrospective', 'opinion']
description: 'Looking back at the dout.dev rebuild a year in: the metrics, the architectural bets that paid off, the mistakes I want to flag for future me.'
canonical_url: false
---

## The premise

A year ago I started the full rewrite of dout.dev. Six months ago the rewrite shipped. Three months ago the editorial series that is ending today started publishing. This post closes the loop.

Three sections: the numbers, the mistakes, and the bets that paid off. Plus the list of things I would do differently if I started over now.

## The numbers

Not growth hacks. Just the honest counters.

**Posts published in the series.** 30, on a weekly Tuesday cadence, starting 2026-04-28.

**Total code shipped.** Approximately 8,000 lines of JavaScript (CMS, template engine, scripts), 3,500 lines of CSS, 1,200 lines of HTML templates. Smaller than I expected. The design system and the template engine are both under 1,000 lines each.

**Bundle size on a post page.** HTML, about 30KB gzipped. CSS, about 8KB gzipped. JS, about 10KB gzipped. Fonts, about 25KB gzipped. Total critical-path bytes on a cold load: roughly 75KB. That is the Web-Almanac 10th percentile — a fraction of what most sites ship.

**Lighthouse scores in the lab.** Performance 99, Accessibility 100, Best Practices 100, SEO 100. These are lab scores, not field, but they track closely for a simple static site.

**Core Web Vitals from CrUX.** LCP median 1.1s. CLS median 0.02. INP median 80ms. All three well within "Good."

**Build time end-to-end.** About 6 seconds on a cold cache, under 2 seconds with incremental builds via `cms:watch`. Fast enough that iteration is never blocked by tooling.

**Deploy frequency.** Averaged about one deploy every 3 days during active development, slowed to one per post after launch. The Pages workflow has never failed due to infrastructure.

**External links, zero broken.** The quality gate catches them. The field is not theoretical; it saved me at least four times during the rewrite when a refactor shifted a URL.

## The mistakes

Six things I got wrong.

**I underestimated the pagination work.** "A pagination component should take a day." It took a week. URL shape, a11y, `rel="prev/next"`, ellipses, multi-archive support, server and client parity — each of those is an evening's work on its own. If I did it again, I would budget a week upfront.

**I shipped the first OG image renderer without font installation.** For a week, every OG image had a system-font fallback that did not match the design. The fix was a one-line YAML step. The mistake was not testing the OG output in CI.

**I forgot to test the search page without JavaScript the first time.** The page loaded but showed "Loading…" forever with JS disabled. The fix was a static fallback in the noscript path. The mistake was an implicit assumption that JS was always available.

**I added `aria-label` to things that did not need it.** Some of those labels made screen reader output worse. The rule I learned afterward: if visible text is present, do not add a redundant label. The cleanup was mechanical.

**I over-used the copilot on architectural decisions for the first two weeks.** I asked it for opinions on the template engine design, the CSS architecture, the URL shape. It gave plausible answers that were mostly not what I wanted. The time I spent re-deciding was wasted. Now I decide first, execute with help.

**I kept the quality gate mostly in my head for too long.** I had scripts, but they were not wired into CI until around milestone M18. Until then, regressions slipped in and I caught them manually. The CI wiring was a half-day; I should have done it in week one.

## The bets that paid off

Five decisions I would make again without hesitation.

**Tokens before pages.** The design system was the best single time investment in the whole project. Every subsequent change — theming, accent color, contrast improvements — compounded on that foundation.

**Custom template engine instead of a library.** I expected to regret this. I do not. The engine is under 1,000 lines, fits in my head, and does exactly what the site needs. It never wakes me up at night.

**Static OG image generation.** Zero runtime cost, perfect reproducibility, trivial to cache. If I had gone with a runtime service I would have a fourth dependency and one more thing to monitor.

**Strict CSP from the start.** Adding CSP after the fact is a nightmare of `unsafe-inline` concessions. Starting strict, with only the concessions actually needed, is much cleaner. The result is a policy I can actually defend.

**Progressive enhancement as a tested contract.** Having the build verify "no-JS paths still work" is the detail that made the PE claim honest instead of aspirational. Without the test, the claim would have silently drifted into a lie.

## What I would redo if I started now

Given everything I know now, the list of changes is short.

**Ship the image pipeline with AVIF alongside WebP.** AVIF encoders have caught up on CPU cost since I started, and the file sizes are better. The next iteration adds AVIF variants.

**Use nonces in the CSP from day one.** The `'unsafe-inline'` concessions in the current policy are two inline scripts. Moving them to nonce-based CSP is a small build-time change I keep deferring.

**Write the editorial plan before the rewrite, not after.** Knowing from the start that the rewrite would be followed by 30 posts would have shaped a few decisions — for example, the archive design would have been more opinionated, and the RSS feeds would have been structured for the series pattern sooner.

**Do the quality gate wiring in week one.** Covered above. CI from the start is the correct default, even on a personal project.

## What stays

The vanilla-first stack, the design system, the template engine, the archives model, the URL shape, the CSP, the progressive enhancement contract, the build-time OG images, the accessible pagination, the service worker. All of these survive unchanged.

The blog, the thing this was all for, also survives — and now has 30 posts on it.

## The last word

An engineering project is never "done." It is shipped. Today the dout.dev rewrite is shipped, the editorial series is shipped, and the next project can begin. The lessons compress well: pick a small stack you can hold in your head, enforce the contracts you claim, lean on a copilot for the tedium, keep decisions to yourself.

Thanks for reading. The feeds are in the head of every page. The comments are on every post.

## References

- [Web Almanac — HTTP Archive](https://almanac.httparchive.org/) — for industry-baseline bundle sizes
- [Lighthouse documentation](https://developer.chrome.com/docs/lighthouse/overview)
- [Chrome User Experience Report](https://developer.chrome.com/docs/crux)
- [The nature of engineering — Will Larson](https://lethain.com/)
