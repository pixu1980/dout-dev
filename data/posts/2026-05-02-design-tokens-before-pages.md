---
title: 'Design Tokens Before Pages (Yes, I Wrote the CSS Before the First Line of HTML)'
date: '2026-05-02'
published: true
tags: ['making-of', 'design-systems', 'css']
series: 'How I made it'
description: 'Why the dout.dev token layer came before the first page, what lives in it, and how CSS custom properties keep the site coherent. No, I didn''t use a design tool.'
canonical_url: false
---

## The mistake I kept making (repeat after me: tokens first)

Every time I started a personal site and went "page first, design system later," I ended up with a pile of local exceptions. A `margin-top: 24px` here, a `color: #f5a623` there, a breakpoint at `768px` on one component and `720px` on another. By the third page the design was already incoherent, and the only way to fix it was to go back and retrofit tokens onto a living codebase. That is the WORST moment to do it. Like painting the inside of your house after you've already moved in.

For dout.dev I flipped the order. **Tokens first, components second, pages third.** This post is what that looks like in practice. No Figma. No design system conference ticket. Just CSS and discipline.

## What I mean by "tokens" (not a design system)

Design tokens are NOT a library. They are a flat set of named decisions, expressed as CSS custom properties, about spacing, type, color, elevation, motion, and layout. The rest of the CSS reads those decisions and NEVER hardcodes.

The rule I hold to is simple: **if a value appears in two components, it becomes a token**. If it only appears once, I wait. YAGNI applies to design systems too.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-8: 3rem;

  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  --surface-1: #0b0b0f;
  --surface-2: #161621;
  --text-primary: #e7e7ef;
  --text-muted: #a0a0b4;

  --focus-ring: 2px solid #ff6b3d;
}
```

That is a single source of truth. It does not know about pages. It does not know about components. It knows about DECISIONS.

## Two layers, not one (because theming is not optional)

Raw tokens alone are not enough for a theme-able site. You need two layers. I use two layers. You should too.

**Primitive tokens** — the raw decisions above. They never change at runtime. They're the concrete values.

**Semantic tokens** — aliases that map intent to primitives. These are the ones components actually read, and these are the ones that flip between themes.

```css
:root {
  --color-bg: var(--surface-1);
  --color-fg: var(--text-primary);
  --color-accent: #ff6b3d;
}

[data-color-scheme='light'] {
  --color-bg: #fafafa;
  --color-fg: #1a1a1a;
}
```

Components then write `color: var(--color-fg)`, never `color: #e7e7ef`. Theme switching becomes a matter of changing a handful of semantic tokens at the root, not rewriting every goddamn rule. This is how adults do CSS.

## Component rules I enforce (no, seriously, I enforce them)

Three rules keep the CSS from rotting. Written down. Checked in code review.

**No magic numbers in components.** If a value is not a token, it is almost always a mistake. The exceptions are genuinely one-off values tied to a specific piece of geometry, and those get a comment explaining why.

**No color literals outside the token file.** Not even in media queries, not even in `box-shadow`. If a color is referenced, it is via a variable. Period.

**No breakpoint literals outside a shared map.** Breakpoints are tokens too, expressed as container query breakpoints or named media queries, never inline numbers.

```css
/* Good */
.post-card {
  padding: var(--space-5);
  background: var(--color-bg-raised);
  color: var(--color-fg);
}

/* Bad */
.post-card {
  padding: 24px;
  background: #161621;
  color: #e7e7ef;
  border-radius: 8px;
}
```

The "bad" version works. It will also be unfixable in a year. Trust me. I've been that guy.

## The payoff during theming (this is where it gets good)

When I added the light theme and the accent selector, the change was a few dozen lines. Every component picked it up for free, because no component hardcoded a single goddamn value. The dark mode toggle, the `prefers-color-scheme` hookup, and the accent switcher are all variations on the same idea: swap the semantic tokens at the root, let the cascade do the rest.

Without the two-layer setup, theming a site usually means touching every component. WITH it, theming is one file. One. That's the power of not being an idiot.

## Where I drew the line (because tools are tools, not religions)

I did not build an elaborate token pipeline. No Style Dictionary, no JSON sources compiled into multiple formats, no cross-platform tokens. This is a single-target CSS project. A flat `.css` file that declares custom properties is enough, and any tooling beyond that would be overhead without a matching benefit.

If the project grew multiplatform — iOS, Android, email, a design tool plugin — I would pull in Style Dictionary. Until then, one file and discipline. Discipline over tools. Every time.

## The takeaway

If you are starting a personal site or a small design system, WRITE THE TOKEN LAYER BEFORE THE FIRST PAGE. It costs an afternoon. It buys you theming, consistency, and the ability to make design changes in ONE PLACE instead of twenty. Your future self will thank you. Your present self will be confused about why you didn't do this years ago.
