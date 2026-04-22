---
title: 'Modern CSS Is Enough: Container Queries, Nesting, `:has()` in Production'
date: '2026-06-02'
published: false
tags: ['css', 'vanilla-js', 'frontend']
description: 'Modern CSS has quietly absorbed most of the reasons people reached for CSS-in-JS or utility frameworks. Here is what shipped on dout.dev and how.'
canonical_url: false
---

## The short version

For about ten years, serious frontend work leaned on tooling that papered over missing CSS features: Sass for nesting, Styled Components for dynamic theming, BEM conventions for scoping, utility frameworks for constraint. Most of those reasons quietly disappeared in the last two browser cycles. Modern CSS has container queries, native nesting, `:has()`, cascade layers, logical properties, `color-mix()`, `clamp()`, and more. On dout.dev I ship all of these, and the CSS is shorter than it would have been five years ago.

This post is not "CSS is cool now." It is a walk through the specific modern features that let me delete a preprocessor and a handful of conventions.

## Container queries instead of media queries

Media queries size components against the viewport. That is the wrong reference frame for components that can appear in a full-width article or a narrow sidebar. Container queries fix it.

```css
.post-card {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 30rem) {
  .post-card__layout {
    display: grid;
    grid-template-columns: 10rem 1fr;
    gap: var(--space-5);
  }
}
```

The card adapts to its container, not the page. You drop it in any layout and it behaves. I removed a half-dozen component-level media queries when I moved to container queries, and I have not missed them.

## Native nesting, without Sass

Native CSS nesting lets you keep related rules together without compiling:

```css
.post-card {
  padding: var(--space-5);
  background: var(--color-bg-raised);

  & h2 {
    font-size: var(--text-xl);
    line-height: var(--font-lineheight-2);
  }

  &:hover {
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
}
```

The only gotcha is the `&` for selectors that would otherwise concatenate ambiguously. It is a small price to pay for deleting the Sass build step. Baseline support is wide; check current status on caniuse if you need to be sure.

## `:has()` for parent-aware styling

`:has()` is the feature CSS was missing for twenty years. "Style the parent based on the child" is now a one-liner:

```css
/* Collapse the sidebar when the article has no table of contents */
.post-layout:has(.outline[hidden]) {
  grid-template-columns: 1fr;
}

/* Highlight figures that contain a caption */
figure:has(figcaption) {
  border-inline-start: 3px solid var(--color-accent);
  padding-inline-start: var(--space-4);
}
```

Anywhere I used to reach for JavaScript to toggle a parent class based on child state, `:has()` does it in the cascade. Less code, no flash of incorrect styling.

## Logical properties

If you care about bidirectional text, or you just want your CSS to stop lying about what it does, logical properties are non-negotiable. Instead of `margin-left` and `padding-right`, you write `margin-inline-start` and `padding-inline-end`. The effect is the same in English and correct in Arabic.

```css
.callout {
  padding-inline: var(--space-5);
  padding-block: var(--space-4);
  border-inline-start: 3px solid var(--color-accent);
}
```

Even in an English-only site like dout.dev, using logical properties is better hygiene. It documents intent, and it makes the CSS future-proof if the site ever goes multilingual.

## `color-mix()` and `clamp()` for token derivation

Two small features that replace a lot of Sass math.

```css
:root {
  --color-accent: #ff6b3d;
  --color-accent-soft: color-mix(in oklch, var(--color-accent) 20%, var(--color-bg));
}

h1 {
  /* Responsive type without media queries */
  font-size: clamp(1.875rem, 1.4rem + 2vw, 3rem);
}
```

`color-mix()` lets you derive shades from semantic tokens at runtime, so theme changes cascade into every derived value. `clamp()` handles fluid type without a script.

## Cascade layers for predictable ordering

On a small project, layering is overkill. On any project with an external reset, a design system, and component-level overrides, cascade layers save you from specificity wars.

```css
@layer reset, tokens, base, components, utilities;

@layer reset {
  /* modern-normalize or similar */
}

@layer components {
  .post-card { /* ... */ }
}
```

The layer order determines which rules win, regardless of specificity. I use it as a safety net, not as a crutch. Most rules still work fine without thinking about it.

## What I did not need

- **No preprocessor.** Nesting, variables, and math are native.
- **No CSS-in-JS.** Tokens + semantic aliases cover dynamic theming at the CSS layer.
- **No utility framework.** For a text-heavy editorial site, utility frameworks add more noise than they save. Your mileage depends on the project.

## The takeaway

If you last wrote CSS seriously three years ago, the landscape is different. Container queries alone are worth a re-evaluation of your conventions. `:has()` kills a whole class of JavaScript hacks. Native nesting and layers kill the preprocessor. Ship what the browser already gives you.

## References

- [Container queries — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [CSS nesting — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting)
- [`:has()` selector — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
- [Cascade layers — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Logical properties and values — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [Can I use](https://caniuse.com/) — check baseline before you ship
