---
title: 'Dark Mode, Accent Color, `prefers-color-scheme`: the Theme Switcher From Scratch'
date: '2026-09-15'
published: false
tags: ['design-systems', 'css', 'a11y', 'accessibility']
description: 'How the theme switcher on dout.dev cycles light/dark/auto, respects system preference, and lets users pick an accent color — without a framework.'
canonical_url: false
---

## The feature, and the three traps

A theme switcher looks simple. Light mode, dark mode, auto. Maybe an accent color. In practice it has three common bugs I see in almost every implementation.

1. **Flash of wrong theme.** The page loads in light, the script runs, the theme swaps to dark. For a fraction of a second the user sees the wrong colors.
2. **System preference ignored after a manual override.** The user picks "dark," closes the tab, comes back later. The site is still dark even though the user has since switched their OS to light. That is correct. The inverse bug: user picked "auto," OS switches to dark, the site stays light because the script does not listen for the change.
3. **Preference lost on refresh.** The theme was in memory, not persisted.

The switcher on dout.dev addresses each explicitly. The code is under 50 lines.

## The token architecture it relies on

The switcher only works because the CSS is already token-driven. Every component reads semantic tokens; semantic tokens are defined on `:root` and overridden per theme.

```css
:root {
  --color-bg: var(--surface-1);
  --color-fg: var(--text-primary);
  --color-accent: #ff6b3d;
}

[data-theme='light'] {
  --color-bg: #fafafa;
  --color-fg: #1a1a1a;
}

[data-theme='dark'] {
  --color-bg: #0b0b0f;
  --color-fg: #e7e7ef;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-bg: #0b0b0f;
    --color-fg: #e7e7ef;
  }
}
```

The rules:

- `:root` defines the defaults (the "auto" case without system preference).
- `[data-theme='light']` and `[data-theme='dark']` override for explicit choices.
- The `@media (prefers-color-scheme: dark)` block kicks in only when no explicit `data-theme` is set — the `:not([data-theme])` selector — so user choice always wins over system preference.

## No flash of wrong theme

The browser must know the theme before it paints the first frame. That means the theme resolution happens in an inline script in the `<head>`, before any CSS that depends on it.

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      var stored_accent = localStorage.getItem('accent');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.dataset.theme = stored;
      }
      if (stored_accent) {
        document.body.dataset.accent = stored_accent;
      }
    } catch (_) { /* localStorage unavailable */ }
  })();
</script>
```

This script is blocking and synchronous and that is exactly what you want. It runs before the body parses, sets the attribute, and the initial CSS cascade applies the correct theme before paint.

If the user has never made a choice, no attribute is set, and the `prefers-color-scheme` media query rules. That is the "auto" path.

## The toggle button

The toggle is a button that cycles Auto → Dark → Light → Auto. The current state is mirrored to `aria-pressed` or announced via text for screen readers.

```html
<button class="theme-toggle" aria-label="Change theme">
  <span class="theme-toggle__label">Auto</span>
</button>
```

```js
const toggle = document.querySelector('.theme-toggle');
const label = toggle.querySelector('.theme-toggle__label');
const order = [null, 'dark', 'light'];

function setTheme(value) {
  if (value === null) {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem('theme');
    label.textContent = 'Auto';
  } else {
    document.documentElement.dataset.theme = value;
    localStorage.setItem('theme', value);
    label.textContent = value === 'dark' ? 'Dark' : 'Light';
  }
}

toggle.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme ?? null;
  const next = order[(order.indexOf(current) + 1) % order.length];
  setTheme(next);
});

const currentOnLoad = document.documentElement.dataset.theme ?? null;
label.textContent = currentOnLoad === null ? 'Auto' : currentOnLoad === 'dark' ? 'Dark' : 'Light';
```

The initial `label.textContent` assignment is subtle: on page load, the inline script has already applied the theme, so we read back from the DOM to render the correct label.

## Listening for system preference changes

In "auto" mode, when the OS switches theme, the site should update live. The `matchMedia` API emits change events:

```js
const media = matchMedia('(prefers-color-scheme: dark)');
media.addEventListener('change', () => {
  // The CSS handles the color change automatically via the media query.
  // Nothing for us to do — the media query in CSS observes the same source.
});
```

Actually, nothing for us to do. The CSS already responds to the system change; this event is only useful if you want to mirror the state somewhere in the UI. If the toggle's label shows "Auto," the visible state on screen updates naturally through CSS.

## Accent color picker

Accent is orthogonal to light/dark. A user can pick a dark theme with a green accent or a light theme with a violet accent. The primary accent is a separate attribute on `body`.

```css
body[data-accent='violet'] { --color-accent: #8b5cf6; }
body[data-accent='green']  { --color-accent: #22c55e; }
```

The picker is a radio group or a row of swatches. Selection writes to `body[data-accent]` and persists to `localStorage`.

The one detail that makes this land: the CSS `--color-accent` is referenced by derived tokens (like `--color-accent-soft` via `color-mix()`), so the whole accent-tinted surface updates in one paint.

## Syncing the Giscus theme

Giscus is an iframe, so its theme does not inherit from the parent page CSS. The page has to postMessage the theme into the iframe whenever it changes.

```js
function syncGiscusTheme(theme) {
  const frame = document.querySelector('iframe.giscus-frame');
  if (!frame) return;
  const giscusTheme = theme === 'dark' ? 'dark' : 'light';
  frame.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: giscusTheme } } },
    'https://giscus.app'
  );
}
```

A MutationObserver on `document.documentElement` watches for `data-theme` changes and calls `syncGiscusTheme`. That keeps comments visually in sync with the rest of the page. Without this, switching from dark to light leaves the comments in a contrast mismatch.

## Keyboard, focus, motion

The toggle is a real `<button>`, which means it is keyboard-focusable by default. Its focus ring uses `:focus-visible`, and clicking it does not steal focus.

For users with `prefers-reduced-motion: reduce`, the accent color transition is disabled. That is a two-line CSS rule:

```css
body { transition: background-color 0.2s, color 0.2s; }

@media (prefers-reduced-motion: reduce) {
  body { transition: none; }
}
```

## The takeaway

A theme switcher that does not flash, respects the system, persists the user's choice, and syncs third-party iframes is about 50 lines of code and one well-structured CSS layer. The trick is the inline pre-paint script and the attribute-plus-media-query architecture. Neither requires a framework.

## References

- [`prefers-color-scheme` — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [`matchMedia` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
- [Theme switcher without FART — web.dev](https://web.dev/articles/color-scheme)
- [Giscus customization API](https://giscus.app/)
- [`color-mix()` — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
