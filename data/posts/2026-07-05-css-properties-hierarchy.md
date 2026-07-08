---
title: 'CSS Properties Hierarchy (Or: How I Learned Custom Properties Can Replace Preprocessors)'
date: '2026-07-05'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['html', 'css']
series: ['Bold Opinions']
description: 'CSS Properties Hierarchy and how custom properties cascade through the design system.'
canonical_url: false
---

## Context - The chaos of unorganized CSS

I've been writing CSS since before `border-radius` was a thing, back when we used `-moz-border-radius` and prayed everything to work well.

I've seen preprocessors rise (LESS, Sass, Stylus, the holy war... what a mess) and watched CSS itself absorb every feature they offered, one spec at a time.

And through all of it, one thing never changed: the absolute chaos of an unorganized ruleset.

We all know about this: 400 lines of CSS where `color: red` is followed by `position: absolute` followed by three vendor-prefixed gradients followed by a `font-size` that overrides the one fifty lines up. It's not wrong, the cascade still resolves it, the browser still paints it, but it's _unnecessary friction_.

Every time you touch that file, you waste a few seconds scanning for what you need. Those seconds add up to hours. Those hours add up to bugs.

So I developed a system. A hierarchy that mirrors the browser's own rendering pipeline: **outside-in, layout-first, paint-last**.

## The hierarchy - every ruleset tells a story

The way I see it, every CSS ruleset tells a story, and the story has a logical narrative arc. The order isn't arbitrary - it's the same order the browser processes properties: **computed values → layout → paint → compositing**.

Every time I break this order, I introduce a subtle cognitive tax on the next reader, myself included. Every time I follow it, the ruleset reads like a coherent paragraph instead of a shopping list.

**1. Custom properties.** These come first because they're the inputs. They're resolved by the cascade before _any_ property does anything. You want them declared before they're consumed, and grouping them at the top makes the ruleset's "API surface" immediately visible.

**2. Position.** Next, because it takes the element _out of flow_ before you even think about sizing or coloring it. Setting `position: absolute` after `width` is technically fine, but logically backwards - you're picking a layout strategy for the element before you decide its dimensions.

**3. Display.** Right after position, because it determines the formatting context. Flex, grid, block - the element needs to know _how to be a box_ before you can meaningfully set `gap`, `place-content`, or `align-items`.

**4. Opacity & visibility.** These affect the box's presence without touching layout. They're the border between layout and paint.

**5. Box-model.** The geometry: **inside-out** - content size first, then padding, then border, then margin. `box-sizing` at the top of the section because it changes the math for everything below.

**6. Colors & background.** The paint layer. Text color, background, shadows, filters. These trigger repaints but not re-layouts (mostly).

**7. Typography.** After you've painted the background, you render the text on top. `font`, `line-height`, `text-align`, `white-space`, `text-shadow`.

**8. Transforms & animations.** The compositor stage. `transform`, `transition`, `animation`. These are the last thing that happens visually, but also the most performance-sensitive - having them in one block makes it easy to audit `will-change` usage.

**9. Helpers.** `appearance`, `cursor`, `pointer-events` - utility properties that don't fit anywhere else.

**10. Pseudo-elements.** `&::before`, `&::after` - they're part of the element's visual tree, nested inside.

**11. Variants & pseudo-selectors.** State changes: `&.error`, `&[aria-hidden]`, `&:hover`. These override everything above, so they come last in the declaration block.

**12. Media queries & children.** Scoping. `@media`, `& span`, `& > *`. These are _new contexts_ that restart the hierarchy - each is a fresh ruleset that follows the same order.

## The complete example

```css
:root {
  --border-radius: 5px;
}

.element {
  /* css custom properties */
  --var--example: 1;

  /* position */
  position: absolute;
  inset: 0; /* top, right, bottom, left */
  z-index: 1;

  /* display */
  display: block;
  display: flex;
  place-content: center;
  place-items: center;
  justify-self: unset;
  gap: 1rem;

  opacity: 1;
  visibility: visible;

  /* box-model */
  box-sizing: border-box;
  width: 10rem;
  aspect-ratio: 16 / 9;
  padding: 1rem;
  border: 0.1rem solid black;
  border-radius: 0.4rem;
  margin: 1rem;
  outline: 0.3rem solid black;
  outline-offset: 0.3rem;

  /* colors & background */
  color: white;
  background-color: black;
  background-image: url();
  box-shadow: rgba(50, 50, 50, 1);
  filter: drop-shadow();

  /* text */
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
  text-align: center;
  text-shadow: none;

  /* transform & animations */
  transform: translate();
  transition: opacity 300ms ease-in, width 500ms linear;
  will-change: opacity, width;
  animation: test 300ms forwards alternate-reverse;

  /* helpers */
  appearance: none;
  cursor: pointer;
  pointer-event: none;

  /* pseudo elements */
  &::after {
  }

  /* variants & pseudo selectors */
  &.error {
    color: red;
  }

  &[aria-hidden=true] {
    display: none;
  }

  /* pseudo selectors */
  &:hover {
  }

  /* media queries */
  @media screen and (width >= 1024px) {
    /* repeat css hierarchy here */
  }

  /* ------------ children */
  span {
    /* repeat css hierarchy here */
  }

  input {
    /* repeat css hierarchy here */
  }

  > * {
    /* repeat css hierarchy here */
  }
}
```

Look at that ruleset. Now look at your last project's CSS. If the two don't look alike, you know what to do.

## Why the hierarchy holds

I'm not going to tell you this hierarchy is the One True Way™ - I've been in this game long enough to know that CSS is a language, not a religion, and anyone who tells you there's exactly one correct way to order properties is selling something (probably a linter rule they wrote). But I _will_ tell you this: having _any_ consistent order is infinitely better than having no order at all. The specific convention matters less than the fact that you have one and you follow it.

What I _will_ claim is that this specific hierarchy has survived three major migrations, six codebases, twelve team members with varying skill levels, and zero arguments. Because it's not "my opinion" - it's the browser's rendering pipeline encoded as property order. You can't argue with the spec. Well, you can, but you'll lose.

The beautiful thing is that once you internalize this order, you stop thinking about it. You just write properties in the order they naturally fall in your head, and they happen to match the hierarchy. It becomes as automatic as indenting nested blocks or putting spaces after commas. The ruleset writes itself, and the next person who opens that file doesn't curse your name. That's the real win.

## The preprocessor epiphany

And yeah, about the preprocessor thing: I started using this hierarchy back when I was writing Sass. When CSS custom properties landed in browsers, I realized `--my-var` slotted perfectly into the top section of the hierarchy - custom properties first, always. Nesting (`&` at the bottom for variants, pseudo-elements, children) was already how I organized Sass. The hierarchy didn't change when the tooling changed. The _language_ caught up to the _discipline_.

That's when it clicked: the hierarchy wasn't a Sass convention. It was a _CSS_ convention that happened to work in Sass. And once native CSS nesting landed in 2023, I deleted my last `@use 'sass'`, not because I hate Sass (I don't), but because the hierarchy made it irrelevant. Discipline beats tooling every time. Always has.

## A challenge for you

So here's my challenge: pick any ruleset in your current project. Reorder it using this hierarchy. Don't change a single value, just move the lines around. Then read it again. I bet you find a bug, or a duplicate property you didn't notice, or an override that doesn't do what you thought. The hierarchy surfaces that stuff because _related things are next to each other_ instead of scattered across 80 lines.

And when you find that bug, think about this: the hierarchy found it, not a linter. A linter can tell you "duplicate property detected." The hierarchy tells you _why_ it's a duplicate and _which one wins_.

Told you. CSS is a language, not a config file.
