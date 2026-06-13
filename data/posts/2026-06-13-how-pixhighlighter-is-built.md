---
title: 'How PixHighlighter Is Built Around the CSS Custom Highlight API'
date: '2026-06-13'
published: true
tags: ['vanilla-js', 'frontend', 'architecture']
description: 'A look inside PixHighlighter, the custom element dout.dev uses for syntax highlighting, theme switching, copy actions, and graceful fallback markup.'
canonical_url: false
---

## The shape of the component

`PixHighlighter` starts with a deliberately plain contract:

```html
<pre is="pix-highlighter" data-lang="js"><code>const answer = 42;</code></pre>
```

That is a customized built-in element. The browser still sees a real `pre` element with a real `code` child, so the source remains copyable, readable without JavaScript, and friendly to assistive technology. The enhancement adds syntax color, a copy action, and a theme picker around that existing text.

The component lives in `src/scripts/components/PixHighlighter/PixHighlighter.js`. It registers itself as `pix-highlighter`, exports `enhancePixHighlighters()`, and also boots on `DOMContentLoaded`. The main site hydration calls that same enhancer again after client-side navigation, so newly swapped article content receives the same treatment as the first page load.

## Styles are installed once

The component imports its CSS with `bundle-text:`. That includes the base component stylesheet plus the theme files for Default, Prism, Pretty Lights, a dark preset, and Cyberpunk.

At runtime, `ensureComponentStyles()` tries to use `document.adoptedStyleSheets`. If constructable stylesheets are available, one shared `CSSStyleSheet` is created and appended to `document.adoptedStyleSheets`. If not, the component falls back to a managed `<style data-pix-highlighter-styles>` element.

The important detail is that every code block shares the same style payload. A page with ten snippets does not create ten copies of the CSS.

## Lexers return ranges, not markup

Each language module under `Lexers/` exports a scanner. JavaScript, TypeScript, CSS, JSON, HTML, Python, Rust, C, C++, PHP, C#, Go, Markdown, YAML, and Bash all follow the same idea: walk the source string, find meaningful ranges, and emit tokens like this:

```js
{ type: 'kw', start: 0, end: 5 }
```

The lexers do not generate HTML. They only describe where a token starts, where it ends, and what visual category it belongs to. That keeps parsing separate from rendering, and it lets the same token stream feed two rendering paths.

Language aliases are normalized before lookup. `javascript` becomes `js`, `typescript` becomes `ts`, `shell` and `zsh` become `bash`, and empty language values fall back to `js`. That is small, but it means content authors do not need to memorize one exact spelling for every fenced code block.

## The preferred renderer uses CSS highlights

When the CSS Custom Highlight API is available, `PixHighlighter` keeps the code text as text. It creates DOM `Range` objects for every token and stores them in shared `Highlight` registries named after token types, for example `pix-kw`, `pix-str`, and `pix-com`.

The CSS then styles those names directly:

```css
::highlight(pix-kw) {
  color: var(--dout--pix-kw);
}
```

That is the best version of the component because it avoids wrapping the code in dozens or hundreds of spans. Selection stays clean, the DOM stays quiet, and the syntax colors remain themeable through CSS variables.

## The fallback is ordinary markup

If `CSS.highlights` or `Highlight` is missing, the component renders token spans instead:

```html
<span data-pix-token="kw">const</span>
```

The fallback uses the same token types and the same visual rules. The only difference is the rendering target. Modern browsers get highlight ranges; older environments get conservative markup. The content is still the same code text.

## Themes are page-wide state

Every instance renders a small toolbar with a copy button and a theme picker. The picker is per block visually, but the selected theme is global. `PixHighlighter.applyTheme()` writes the value to `document.documentElement.dataset.pixHighlighterTheme`, stores it in `localStorage`, and asks every active instance to sync its control state.

That avoids the odd experience of one snippet using a dark preset and the next one being Prism unless the reader explicitly changes the whole page theme.

The theme menu uses CSS anchor positioning when the browser supports it. When it does not, the component measures the trigger, positions the list with fixed coordinates, and keeps it inside the viewport. The behavior is progressive enhancement all the way down.

## Copy is based on the source text

The copy button reads `code.textContent`, not highlighted markup. If the Clipboard API exists, it calls `navigator.clipboard.writeText()`. If that fails or is unavailable, it falls back to a temporary textarea and `document.execCommand('copy')`.

The button state is intentionally tiny: idle, copied, or error. Each state swaps the icon and accessible label, then resets after a short delay. The visible UI is compact, but the control still has a proper name through `aria-label` and hidden text.

## Why this shape fits dout.dev

`PixHighlighter` is not trying to beat a TextMate-grade highlighter at language fidelity. It is built for a static editorial site with short examples, no runtime dependencies, and a design system that already owns color and motion.

The component wins by keeping the contract small:

1. Markdown emits semantic code blocks.
2. Lexers produce token ranges.
3. The CSS Custom Highlight API paints those ranges when available.
4. Span markup keeps older browsers covered.
5. Themes and copy controls are progressive enhancements, not requirements.

That is the pattern I like most in this codebase: ordinary HTML first, modern browser APIs where they help, and fallback paths that do not require a second implementation of the content model.
