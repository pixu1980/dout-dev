---
title: 'How PixHighlighter Is Built (Or: I Wrote a Syntax Highlighter Because Prism Was Too Bloaty)'
date: '2026-06-06'
published: true
tags: ['vanilla-js', 'frontend', 'architecture']
series: ['How I made it', 'pix-components']  
description: 'A look inside PixHighlighter, the custom element dout.dev uses to highlight code with clean text ranges, CSS highlights, theme switching, and fallback markup. No, it does not use 500 span elements.'
canonical_url: false
---

## The contract stays plain (because HTML should be readable)

`PixHighlighter` begins with the smallest useful shape:

```html
<pre is="pix-highlighter" data-lang="js"><code>const answer = 42;</code></pre>
```

That is still a real `<pre>` element with a real `<code>` child. The source is readable BEFORE JavaScript runs, copyable as text, and understandable to assistive technology. The component does not need a custom shadow tree to make code look like code.

**The important decision is what it refuses to do by default:** the primary path does NOT wrap every token in markup. The code block is not a pile of span wrappers. It is ONE text node that can be painted by the browser. This is the kind of detail that separates "it works" from "it works well."

## Lexers describe positions (not markup)

Each lexer under `src/scripts/components/PixHighlighter/Lexers/` walks the source and emits ranges:

```js
{ type: 'kw', start: 0, end: 5 }
```

That object says "the characters from 0 to 5 are a keyword." It does NOT say "insert a span here." Parsing and rendering stay separate. The same token stream can power the modern renderer, the fallback renderer, tests, and any future diagnostics without changing the source model.

Language aliases are normalized before lookup. `javascript` becomes `js`, `typescript` becomes `ts`, `shell` and `zsh` become `bash`. Content authors get a forgiving interface; the renderer gets ONE clean language key. Consistency is a feature.

## CSS Custom Highlight API does the painting (this is the clever part)

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

That is the whole goddamn trick. The browser paints a range of text WITHOUT changing the text into markup. Selection stays clean. Copy stays clean. The DOM stays quiet. Themes remain normal CSS variables instead of a second token system hidden inside generated spans.

## The fallback is deliberately boring (because boring is reliable)

The rule is simple: fallback spans only when the Highlight API is unavailable. In that case, the component maps the same token ranges to conservative markup:

```html
<span data-token="kw">const</span>
```

The fallback is NOT a different highlighter. It is the same lexer output rendered into older browser primitives. The CSS already has matching rules for `[data-token='kw']`, `[data-token='str']`, and the rest of the token types, so the visual result remains close without forcing modern browsers to carry extra DOM.

## Styles are shared once (because performance matters)

Ten code blocks still get ONE style payload. The component can appear throughout an article without multiplying its CSS. No duplication. No waste.

## Themes are page state (not component state)

Every instance renders a compact toolbar with copy and theme controls. The picker appears per block, but the selected theme is page-wide state. That avoids a page where one snippet is using one palette and the next snippet is using another because of local component state. Code theme is a reading preference, so the page owns it.

## Copy reads the source (not the highlights)

The copy button reads `code.textContent`. It does NOT inspect highlight ranges, fallback spans, toolbar state, or theme state. Highlighting is visual; the source text is the contract.

## Why this fits dout.dev (the architecture summary)

`PixHighlighter` is built for a static editorial site: short examples, no frontend framework, no runtime highlighter dependency, and a design system that already owns typography, color, and motion.

The architecture works because each layer has ONE job:

1. Markdown emits semantic code blocks.
2. Lexers produce token ranges.
3. The CSS Custom Highlight API paints those ranges without spans.
4. Fallback markup covers browsers without highlight support.
5. Toolbar actions enhance the block without becoming the content.

That is the pattern I want here: ordinary HTML first, modern browser APIs where they remove markup, and a fallback that preserves the same source text instead of inventing a second content model.
