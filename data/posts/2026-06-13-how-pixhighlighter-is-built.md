---
title: 'How PixHighlighter Is Built Around the CSS Custom Highlight API'
date: '2026-06-13'
published: true
tags: ['vanilla-js', 'frontend', 'architecture']
description: 'A look inside PixHighlighter, the custom element dout.dev uses to highlight code with clean text ranges, CSS highlights, theme switching, and fallback markup only when needed.'
canonical_url: false
---

## The contract stays plain

`PixHighlighter` begins with the smallest useful shape:

```html
<pre is="pix-highlighter" data-lang="js"><code>const answer = 42;</code></pre>
```

That is still a real `pre` element with a real `code` child. The source is readable before JavaScript runs, copyable as text, and understandable to assistive technology. The component does not need a custom shadow tree to make code look like code.

**The important decision is what it refuses to do by default:** the primary path does not wrap every token in markup. The code block is not a pile of span wrappers. It is one text node that can be painted by the browser.

## Lexers describe positions

Each lexer under `src/scripts/components/PixHighlighter/Lexers/` walks the source and emits ranges:

```js
{ type: 'kw', start: 0, end: 5 }
```

That object says "the characters from 0 to 5 are a keyword." It does not say "insert a span here." Parsing and rendering stay separate. The same token stream can power the modern renderer, the fallback renderer, tests, and any future diagnostics without changing the source model.

Language aliases are normalized before lookup. `javascript` becomes `js`, `typescript` becomes `ts`, `shell` and `zsh` become `bash`, and empty language values fall back to `js`. Content authors get a forgiving interface; the renderer gets one clean language key.

## CSS Custom Highlight API does the painting

The best version of `PixHighlighter` uses the CSS Custom Highlight API. When `CSS.highlights` and `Highlight` exist, the component creates DOM `Range` objects for each token and stores them in named highlight registries:

```js
const highlight = new Highlight(range);
CSS.highlights.set('pix-kw', highlight);
```

CSS then styles those names directly:

```css
::highlight(pix-kw) {
  color: var(--pix-highlighter--kw);
}
```

That is the whole trick. The browser paints a range of text without changing the text into markup. Selection stays clean. Copy stays clean. The DOM stays quiet. Themes remain normal CSS variables instead of a second token system hidden inside generated spans.

## The fallback is deliberately boring

The rule is simple: fallback spans only when the Highlight API is unavailable. In that case, the component maps the same token ranges to conservative markup:

```html
<span data-token="kw">const</span>
```

The fallback is not a different highlighter. It is the same lexer output rendered into older browser primitives. The CSS already has matching rules for `[data-token='kw']`, `[data-token='str']`, and the rest of the token types, so the visual result remains close without forcing modern browsers to carry extra DOM.

## Styles are shared once

The component imports its CSS with `bundle-text:`. That bundle includes the base component stylesheet plus the theme files.

At runtime, `ensureComponentStyles()` prefers `document.adoptedStyleSheets`. If constructable stylesheets are available, one `CSSStyleSheet` is created and shared by every instance. If not, the component injects one managed `<style data-styles>` element.

Ten code blocks still get one style payload. The component can appear throughout an article without multiplying its CSS.

## Themes are page state

Every instance renders a compact toolbar with copy and theme controls. The picker appears per block, but the selected theme is page-wide state. `PixHighlighter.applyTheme()` writes the value to `document.documentElement.dataset.pixHighlighterTheme`, persists it in `localStorage`, and syncs every active instance.

That avoids a page where one snippet is using one palette and the next snippet is using another because of local component state. Code theme is a reading preference, so the page owns it.

The menu also uses progressive layout. CSS anchor positioning handles the clean path. When the browser lacks it, the component measures the trigger and keeps the list inside the viewport with fixed coordinates.

## Copy reads the source

The copy button reads `code.textContent`. It does not inspect highlight ranges, fallback spans, toolbar state, or theme state. Highlighting is visual; the source text is the contract.

If the Clipboard API is available, the component calls `navigator.clipboard.writeText()`. If that path fails, it falls back to a temporary textarea and `document.execCommand('copy')`. The UI states are intentionally small: idle, copied, or error, each with an accessible label.

## Why this fits dout.dev

`PixHighlighter` is built for a static editorial site: short examples, no frontend framework, no runtime highlighter dependency, and a design system that already owns typography, color, and motion.

The architecture works because each layer has one job:

1. Markdown emits semantic code blocks.
2. Lexers produce token ranges.
3. The CSS Custom Highlight API paints those ranges without spans.
4. Fallback markup covers browsers without highlight support.
5. Toolbar actions enhance the block without becoming the content.

That is the pattern I want here: ordinary HTML first, modern browser APIs where they remove markup, and a fallback that preserves the same source text instead of inventing a second content model.
