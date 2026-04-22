---
title: 'Honest Focus Traps and Escape: Keyboard-First Menus'
date: '2026-09-29'
published: false
tags: ['accessibility', 'a11y', 'vanilla-js']
description: 'Focus traps done right: what they are for, when they are a bug, and the handful of rules that keep overlays keyboard-first without locking users inside them.'
canonical_url: false
---

## The misconception

"Focus trap" has a bad reputation because most implementations get it wrong. A trap that is actually a prison — where the user cannot escape with Escape, cannot close with a click outside, and cannot tell that they are trapped — is a bug.

A focus trap done right is a kindness. It says: "while this overlay is open, Tab cycles within it. When you close it, focus returns where it came from. Escape works. Outside click works."

On dout.dev the mobile menu, the search dialog, and any future modal follow the same rules. This post is those rules, with code.

## When a focus trap is appropriate

Two criteria, both required.

1. **The overlay is modal.** The user is expected to interact with it or dismiss it before doing anything else. A non-modal popover — a tooltip, an inline disclosure — should not trap focus.
2. **The overlay visually blocks the rest of the page.** A full-screen dialog, a slide-in panel, a menu that darkens the page behind it.

If either is false, do not add a trap. A tooltip trap is a bug.

## The five rules of a good trap

**Rule 1: remember where focus was.**

```js
let previouslyFocused = null;

function openOverlay(overlay) {
  previouslyFocused = document.activeElement;
  // …
}

function closeOverlay(overlay) {
  overlay.hidden = true;
  previouslyFocused?.focus();
  previouslyFocused = null;
}
```

When the overlay closes, focus returns to the element that opened it. Without this, focus goes to `document.body`, and the next Tab jumps to the top of the page. Disorienting.

**Rule 2: move focus into the overlay on open.**

```js
function openOverlay(overlay) {
  previouslyFocused = document.activeElement;
  overlay.hidden = false;

  const firstFocusable = overlay.querySelector(
    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}
```

The first interactive element inside the overlay receives focus. Screen readers announce it. Keyboard users are immediately in context.

**Rule 3: cycle Tab within the overlay.**

```js
function trapFocus(event, overlay) {
  if (event.key !== 'Tab') return;

  const focusables = overlay.querySelectorAll(
    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

Tabbing past the last element wraps to the first. Shift+Tab past the first wraps to the last. Anywhere in between, default Tab behavior.

**Rule 4: Escape closes.**

```js
function handleKeydown(event, overlay) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeOverlay(overlay);
    return;
  }
  trapFocus(event, overlay);
}
```

Universal expectation. Not optional.

**Rule 5: outside click closes.**

```js
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) {
    // Click on the backdrop, not a child
    closeOverlay(overlay);
  }
});
```

If the overlay is a full-screen layer with a visible backdrop, clicking the backdrop is a valid close affordance. Screen reader users have Escape; pointer users have click-outside.

## Putting it together

```js
class Overlay {
  constructor(root, { onClose } = {}) {
    this.root = root;
    this.onClose = onClose;
    this.previouslyFocused = null;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  open() {
    this.previouslyFocused = document.activeElement;
    this.root.hidden = false;
    const first = this.getFocusables()[0];
    first?.focus();
    document.addEventListener('keydown', this.handleKeydown);
    this.root.addEventListener('click', this.handleClick);
  }

  close() {
    this.root.hidden = true;
    document.removeEventListener('keydown', this.handleKeydown);
    this.root.removeEventListener('click', this.handleClick);
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
    this.onClose?.();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = this.getFocusables();
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  handleClick(event) {
    if (event.target === this.root) this.close();
  }

  getFocusables() {
    return this.root.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
  }
}
```

60 lines, reusable, no framework. Every overlay on dout.dev uses it.

## The ARIA that the component needs

The overlay element itself needs the right roles and attributes, not just the JS.

```html
<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title" hidden>
  <h2 id="overlay-title">Menu</h2>
  <!-- … -->
</div>
```

- `role="dialog"` tells assistive tech this is a modal.
- `aria-modal="true"` indicates that the rest of the page is inert while the dialog is open.
- `aria-labelledby` points to the visible title so screen readers announce it when focus moves in.
- `hidden` is the default state; JS toggles it.

Without these, the JS trap works for keyboard users but screen readers do not understand that they are in a modal context. Both layers have to agree.

## What I do not do

- **Focus-within timing hacks.** `setTimeout(focus, 0)` is almost always a sign that the DOM is not ready. Fix the timing, not the symptom.
- **Overscroll lock via `body { overflow: hidden }`.** Sometimes useful, often jarring. On dout.dev the overlays are full-screen so scroll lock is redundant.
- **Inert polyfills.** The `inert` attribute on the background content is still not uniformly supported. `aria-modal="true"` is enough for current assistive tech.

## The takeaway

A focus trap is not the JavaScript pattern. It is the contract: remember where focus was, move focus to the overlay, cycle Tab within it, honor Escape, honor outside click. Sixty lines of code, five rules, one reusable class. Every modal on a well-built site follows the same shape.

## References

- [WAI-ARIA Authoring Practices: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Inert — MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)
- [WCAG 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [WCAG 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [focus-trap (library)](https://github.com/focus-trap/focus-trap) — if you prefer a ready-made option
