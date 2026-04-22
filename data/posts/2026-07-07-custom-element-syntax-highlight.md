---
title: 'A Custom Element for Syntax Highlight: Why I Wrote `pix-highlighter`'
date: '2026-07-07'
published: false
tags: ['vanilla-js', 'architecture', 'frontend']
description: 'Why dout.dev ships its own syntax highlighter as a custom element instead of Prism or Shiki, what the trade-offs are, and how the renderer hooks into the build.'
canonical_url: false
---

## The stack I did not want

Syntax highlighting on a blog is one of those problems with three plausible solutions, all of which bring a tax.

- **Prism or highlight.js at runtime.** Small API, reasonable language support, but it ships JavaScript to every reader even for cold visits that never view code.
- **Shiki at build time.** Produces beautiful, VS Code-parity output, but pulls a full TextMate grammar engine into the build. The dependency graph is non-trivial and the output HTML is dense.
- **Pygments or Rouge via a Ruby dependency.** Excellent output, but I did not want a second-language toolchain in the pipeline.

For dout.dev I wanted something smaller than all three, with full control over the CSS tokens. The result is `pix-highlighter`, a custom element that takes the markdown fenced-code output, tokenizes on the client with a small lexer, and emits `<span>` tags keyed to design system tokens.

That choice has trade-offs. This post explains them honestly.

## What the renderer emits

The markdown renderer does not highlight. It emits structural markup:

```html
<pre is="pix-highlighter" lang="js">
  <code>function hello() { return 42; }</code>
</pre>
```

`<pre is="pix-highlighter" lang="js">` is a customized built-in element. It upgrades `<pre>` with new behavior while keeping the semantic element intact. Screen readers and copy-paste behave correctly; the upgrade is purely visual.

## The custom element

The element is under 300 lines. It knows how to:

1. Read `lang` and pick the lexer.
2. Tokenize the text content into `{ type, value }` tuples.
3. Render a sequence of `<span class="tok-<type>">` wrapping the tokens.
4. Expose a `copy` button that puts the raw source on the clipboard.

```js
class PixHighlighter extends HTMLPreElement {
  connectedCallback() {
    const code = this.querySelector('code');
    if (!code || this.dataset.highlighted) return;

    const lang = this.getAttribute('lang');
    const lexer = LEXERS[lang];
    if (!lexer) return;

    const tokens = lexer(code.textContent);
    code.innerHTML = tokens
      .map((t) => `<span class="tok-${t.type}">${escapeHtml(t.value)}</span>`)
      .join('');

    this.dataset.highlighted = 'true';
    this.appendCopyButton(code.textContent);
  }
}

customElements.define('pix-highlighter', PixHighlighter, { extends: 'pre' });
```

The element only runs where `<pre is="pix-highlighter">` exists in the DOM. The bulk of the site — every page without a code block — pays nothing for it.

## The lexers are small on purpose

Each lexer is a single function that walks the string once and emits tokens. The language coverage is intentionally narrow: JS, TS, CSS, HTML, JSON, Bash, Python, Go, Rust, C, C++, PHP, C#, YAML, Markdown.

```js
function lexJs(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    let m;
    if ((m = rest.match(/^\/\/[^\n]*/))) {
      tokens.push({ type: 'comment', value: m[0] });
    } else if ((m = rest.match(/^"(?:[^"\\]|\\.)*"/))) {
      tokens.push({ type: 'string', value: m[0] });
    } else if ((m = rest.match(/^\b(function|return|const|let|var|if|else|for)\b/))) {
      tokens.push({ type: 'keyword', value: m[0] });
    } else if ((m = rest.match(/^\d+(?:\.\d+)?/))) {
      tokens.push({ type: 'number', value: m[0] });
    } else if ((m = rest.match(/^\s+/))) {
      tokens.push({ type: 'ws', value: m[0] });
    } else {
      tokens.push({ type: 'text', value: source[i] });
      i += 1;
      continue;
    }
    i += m[0].length;
  }
  return tokens;
}
```

This is not correct in the "TextMate-grade" sense. It does not understand JSX, template literal interpolation, or JSDoc. It is correct enough for blog code samples, which are short, self-contained, and visually parseable.

If I wanted the last 5% of fidelity, I would use Shiki. I did not.

## The CSS is design system tokens, not theme files

Because the element emits `<span class="tok-string">` and similar, the CSS lives in the design system. Colors reference semantic tokens, which means the highlighter follows the theme switcher automatically.

```css
pre[is='pix-highlighter'] {
  background: var(--color-code-bg);
  color: var(--color-code-fg);
  padding: var(--space-4);
  border-radius: var(--radius-2);
  font: var(--font-mono);
}

.tok-comment { color: var(--color-code-comment); font-style: italic; }
.tok-string  { color: var(--color-code-string); }
.tok-keyword { color: var(--color-code-keyword); font-weight: 600; }
.tok-number  { color: var(--color-code-number); }
```

No separate "light theme" and "dark theme" stylesheets. One set of rules, driven by semantic tokens, which flip based on `data-theme`.

## Accessibility

The copy-to-clipboard button has a visible label and an accessible name. The `<pre>` has a semantic code region, the `<code>` inside keeps the text content intact, and the token spans are decorative — aria-hidden would be wrong because they do contain the text the screen reader should read; the tokens are styling, not semantics.

On a keyboard-only pass, the copy button receives focus with a visible ring, press fires the copy, and `aria-live="polite"` on a sibling span announces "Copied."

## When I would not do this

If the blog needed twenty languages with accurate semantic highlighting (JSX, template literals, complex macro systems), the cost of maintaining a handwritten lexer family would exceed the cost of adopting Shiki at build time. The trade-off is genuinely a spectrum.

The cutoff I used: fewer than twenty languages, short code samples, theme integration matters, bundle size matters, fidelity at the 95% level is acceptable. Write your own. Otherwise, use Shiki.

## The takeaway

Custom elements are underrated. A ~300-line `pix-highlighter` replaces a dependency I would have carried forever, integrates with the design system instead of a theme file, and only runs where it is needed. That pattern — small, scoped, declarative — fits the rest of dout.dev.

## References

- [Web Components: Custom Elements — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Customized built-in elements — HTML Living Standard](https://html.spec.whatwg.org/multipage/custom-elements.html#customized-built-in-elements)
- [Shiki](https://shiki.style/) — if you need TextMate-grade output
- [Prism](https://prismjs.com/) — if you need runtime highlighting with minimal setup
- [Highlight.js](https://highlightjs.org/) — the other runtime option
