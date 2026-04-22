---
title: 'Design Tokens Before Pages: Avoiding Spaghetti CSS'
date: '2026-05-26'
published: false
tags: ['design-systems', 'css', 'vanilla-js', 'architecture']
description: 'Why I wrote the token layer before the first page of dout.dev, what lives in it, and how a small set of CSS custom properties keeps the whole site coherent.'
canonical_url: false
---

## The mistake I kept making

Every time I started a personal site and went "page first, design system later," I ended up with a pile of local exceptions. A `margin-top: 24px` here, a `color: #f5a623` there, a breakpoint at `768px` on one component and `720px` on another. By the third page the design was already incoherent, and the only way to fix it was to go back and retrofit tokens onto a living codebase. That is the worst moment to do it.

For dout.dev I flipped the order. Tokens first, components second, pages third. This post is what that looks like in practice.

## What I mean by "tokens"

Design tokens are not a library. They are a flat set of named decisions, expressed as CSS custom properties, about spacing, type, color, elevation, motion, and layout. The rest of the CSS reads those decisions and never hardcodes.

The rule I hold to is simple: **if a value appears in two components, it becomes a token**. If it only appears once, I wait.

```css
:root {
  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-8: 3rem;

  /* Type scale */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Line-height families */
  --font-lineheight-1: 1.1;
  --font-lineheight-3: 1.5;

  /* Surfaces and text */
  --surface-1: #0b0b0f;
  --surface-2: #161621;
  --text-primary: #e7e7ef;
  --text-muted: #a0a0b4;

  /* Focus */
  --focus-ring: 2px solid #ff6b3d;
}
```

That is a single source of truth. It does not know about pages. It does not know about components. It knows about decisions.

## Two layers, not one

Raw tokens alone are not enough for a theme-able site. I use two layers:

**Primitive tokens** — the raw decisions above. They never change at runtime.

**Semantic tokens** — aliases that map intent to primitives. These are the ones components actually read, and these are the ones that flip between themes.

```css
:root {
  --color-bg: var(--surface-1);
  --color-bg-raised: var(--surface-2);
  --color-fg: var(--text-primary);
  --color-fg-muted: var(--text-muted);
  --color-accent: #ff6b3d;
}

[data-theme='light'] {
  --color-bg: #fafafa;
  --color-bg-raised: #ffffff;
  --color-fg: #1a1a1a;
  --color-fg-muted: #555566;
}
```

Components then write `color: var(--color-fg)`, never `color: #e7e7ef`. Theme switching becomes a matter of changing a handful of semantic tokens at the root, not rewriting every rule.

## Component rules I enforce

Three rules keep the CSS from rotting.

**No magic numbers in components.** If a value is not a token, it is almost always a mistake. The exceptions are genuinely one-off values tied to a specific piece of geometry, and those get a comment.

**No color literals outside the token file.** Not even in media queries, not even in `box-shadow`. If a color is referenced, it is via a variable.

**No breakpoint literals outside a shared map.** Breakpoints are tokens too, expressed as container query breakpoints or named media queries, never inline.

```css
/* Good */
.post-card {
  padding: var(--space-5);
  background: var(--color-bg-raised);
  color: var(--color-fg);
  border-radius: var(--radius-2);
}

/* Bad */
.post-card {
  padding: 24px;
  background: #161621;
  color: #e7e7ef;
  border-radius: 8px;
}
```

The "bad" version works. It will also be unfixable in a year.

## The payoff during theming

When I added the light theme and the accent selector, the change was a few dozen lines. Every component picked it up for free, because no component hardcoded a value. The dark mode toggle, the `prefers-color-scheme` hookup, and the accent switcher are all variations on the same idea: swap the semantic tokens at the root, let the cascade do the rest.

Without the two-layer setup, theming a site usually means touching every component. With it, theming is one file.

## Where I drew the line

I did not build an elaborate token pipeline. No Style Dictionary, no JSON sources compiled into multiple formats, no cross-platform tokens. This is a single-target CSS project. A flat `.css` file that declares custom properties is enough, and any tooling beyond that would be overhead without a matching benefit.

If the project grew multiplatform — iOS, Android, email, a design tool plugin — I would pull in Style Dictionary. Until then, one file and discipline.

## The takeaway

If you are starting a personal site or a small design system, write the token layer before the first page. It costs an afternoon. It buys you theming, consistency, and the ability to make design changes in one place instead of twenty.

## References

- [CSS Custom Properties — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Open Props](https://open-props.style/) — a useful reference for a flat token set
