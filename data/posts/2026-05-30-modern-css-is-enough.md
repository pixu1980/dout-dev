---
title: 'Modern CSS Is Enough (Container Queries, Nesting, `:has()` — No Framework Required)'
date: '2026-05-30'
published: true
tags: ['css', 'vanilla-js', 'frontend']
series: 'How I made it'
description: 'Modern CSS has quietly absorbed most of the reasons people reached for CSS-in-JS or utility frameworks. Here is what shipped on dout.dev and how. Spoiler: no Sass.'
canonical_url: false
---

## The short version (for the impatient)

For about ten years, serious frontend work leaned on tooling that papered over missing CSS features: Sass for nesting, Styled Components for dynamic theming, BEM conventions for scoping, utility frameworks for constraint. Most of those reasons quietly disappeared in the last two browser cycles. Modern CSS has container queries, native nesting, `:has()`, cascade layers, logical properties, `color-mix()`, `clamp()`, and more. On dout.dev I ship ALL of these, and the CSS is shorter than it would have been five years ago.

This post is NOT "CSS is cool now." It is **a walk through specific modern features that let me delete a preprocessor and a handful of conventions**. If you're still using Sass in 2026, we need to talk.

## Container queries instead of media queries

Media queries size components against the viewport. That is the WRONG reference frame for components that can appear in a full-width article or a narrow sidebar. Container queries fix it.

```css
.post-card {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .post-card__title { font-size: var(--text-xl); }
}
```

The component queries its own parent, not the viewport. That is the correct behavior for a reusable component. Media queries are for layout; container queries are for components.

## The features I actually use

**Native nesting** — `header { h1 { ... } }` works in every modern browser. No Sass compilation step. No `&` prefix needed for simple selectors.

**`:has()` selector** — the "parent selector" CSS always needed. `post-card:has(> img)` to style cards differently when they have cover images. No JavaScript, no extra class.

**Cascade layers** — `@layer base, components, utilities` lets you control specificity order explicitly instead of fighting it with `!important`.

**`color-mix()`** — `color-mix(in srgb, var(--color-accent), white 20%)` gives you tinted variants without maintaining color scales.

**`clamp()`** — `font-size: clamp(1rem, 2.5vw, 1.5rem)` gives you fluid typography without breakpoints.

## What I removed

- **Sass.** Nesting is native. Variables are custom properties. `darken()` is `color-mix()`.
- **BEM.** Cascade layers and `@scope` reduce the need for naming conventions.
- **PostCSS plugins.** Most of what they did is now native or unnecessary.
- **A CSS reset.** `box-sizing: border-box` on everything and `margin: 0` on body covers 90% of the cases.

## The takeaway

Modern CSS is not a toy. It is a production-ready styling system that has absorbed most of the reasons people reached for preprocessors and frameworks. If you are still reaching for Sass or a CSS framework out of habit, take a weekend to audit what you actually need. The answer might be "less than you think."

Your bundle will thank you. Your users will thank you. Your future self maintaining this in 2030 will thank you.
