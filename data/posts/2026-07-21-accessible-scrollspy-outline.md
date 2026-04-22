---
title: 'Accessible Scrollspy and Outline Without `contenteditable`'
date: '2026-07-21'
published: false
tags: ['accessibility', 'a11y', 'vanilla-js', 'frontend']
description: 'A scrollspy that survives keyboard navigation, announces correctly to screen readers, and does not require any of the hacky patterns that ship in typical implementations.'
canonical_url: false
---

## The feature and its trap

A long post benefits from a sidebar outline that highlights the current section as the user scrolls. On a blog with 1500-word articles, it is the difference between a linear reading experience and a navigable document.

Most scrollspy implementations have three accessibility problems.

1. They rely on the browser's scroll event, which fires too often and updates the active state with a jitter that confuses screen readers.
2. They make the headings focusable in ways that break keyboard expectations — `tabindex="0"` on every `h2` is a trap, not a feature.
3. They announce the current section via `aria-current` that changes several times per second during scroll, which turns the outline into a screaming live region.

This post is the design I landed on after tripping over all three.

## The DOM shape

The outline is a normal `<nav>` with a list of anchor links to heading IDs. That is the document you would get from a static site with no JavaScript. Everything else is enhancement.

```html
<aside class="post-outline">
  <nav aria-label="Article outline">
    <ol>
      <li>
        <a href="#the-feature-and-its-trap">The feature and its trap</a>
      </li>
      <li>
        <a href="#the-dom-shape">The DOM shape</a>
      </li>
      <li>
        <a href="#observing-headings-not-scroll">Observing headings, not scroll</a>
      </li>
    </ol>
  </nav>
</aside>
```

Without JS: you get a jump-link navigation. With JS: the active link gets `aria-current="location"` based on what is currently visible.

## Headings have IDs, and they are focusable on purpose

The post generator emits IDs on every heading (`## The DOM shape` → `id="the-dom-shape"`). It also adds `tabindex="-1"` to headings, so they can receive programmatic focus when a user activates an outline link. Without that, focus remains on the link that was activated, and the next tab stop is inside the link list instead of the section body.

```html
<h2 id="the-dom-shape" tabindex="-1">The DOM shape</h2>
```

`tabindex="-1"` makes the heading programmatically focusable without adding it to the tab order. That is the shape you want for anchor targets. `tabindex="0"` would make every heading a tab stop and is wrong.

## Observing headings, not scroll

Listening to `scroll` and computing which heading is "current" is a trap. It fires constantly, it does not know about the viewport's relevance cone, and it forces you to recompute heading positions on resize.

The right primitive is IntersectionObserver. Point it at the headings with a top-biased root margin, and let it tell you when headings enter or leave the relevance zone.

```js
const headings = document.querySelectorAll('article h2[id], article h3[id]');
const outline = document.querySelector('.post-outline');

let currentId = null;

const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      currentId = entry.target.id;
    }
  }
  if (currentId) updateOutline(currentId);
}, {
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0,
});

for (const h of headings) io.observe(h);
```

The `rootMargin` shrinks the "active" band to the upper part of the viewport. A heading is "current" when it enters that band, which matches the reader's expectation.

## Updating the outline without thrashing ARIA

The update function removes `aria-current` from all outline links and adds it only to the active one. That is a tiny DOM change, not a re-render.

```js
function updateOutline(id) {
  const active = outline.querySelector('[aria-current]');
  if (active) active.removeAttribute('aria-current');

  const next = outline.querySelector(`a[href="#${CSS.escape(id)}"]`);
  if (next) next.setAttribute('aria-current', 'location');
}
```

`aria-current="location"` is the correct value for "this link points at the user's current location in the document." `aria-current="page"` is wrong here; that one is for pagination or site navigation.

## Throttling is not needed

IntersectionObserver is already asynchronous and batched. Callbacks fire at animation-frame cadence at most, and only when the observed elements actually cross a threshold. No `requestAnimationFrame` wrapper, no `throttle`, no debouncer. Writing one of those on top of IntersectionObserver is a code smell.

## Smooth scroll and focus after link click

When the user clicks an outline link, the default behavior jumps to the anchor. On dout.dev the behavior is enhanced: smooth-scroll to the heading, then move focus to the heading so that subsequent tab keys land inside the section.

```js
outline.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  e.preventDefault();

  const id = decodeURIComponent(link.hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });

  history.pushState(null, '', `#${id}`);
});
```

Two subtleties.

**`preventScroll: true` on focus.** Without it, `focus()` scrolls the heading to the top of the viewport, which fights the smooth-scroll animation.

**`history.pushState` instead of assigning `location.hash`.** Setting the hash re-triggers the native jump and cancels the smooth scroll. Pushing the URL manually gives the user a shareable link without breaking the animation.

## Reduced motion

Anyone with `prefers-reduced-motion: reduce` gets an instant scroll instead of smooth.

```js
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
target.scrollIntoView({
  behavior: reduceMotion ? 'auto' : 'smooth',
  block: 'start',
});
```

The cost is one line. The benefit is that users with vestibular sensitivity do not get attacked by your animations.

## The takeaway

A good scrollspy is three primitives the platform already gives you: IDs on headings, `tabindex="-1"` on the targets, and IntersectionObserver for the activation logic. Anything more than that is a leak.

## References

- [IntersectionObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
- [`aria-current` — W3C ARIA](https://www.w3.org/TR/wai-aria-1.2/#aria-current)
- [`tabindex` — HTML Living Standard](https://html.spec.whatwg.org/multipage/interaction.html#attr-tabindex)
- [`prefers-reduced-motion` — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.2 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
