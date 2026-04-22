---
title: 'An HTML-Native Template Engine Without eval()'
date: '2026-05-19'
published: false
tags: ['architecture', 'vanilla-js', 'frontend', 'static-site']
description: 'How the dout.dev template engine handles extends, blocks, includes, expressions and control flow while keeping the syntax close to HTML and the evaluator sandboxed.'
canonical_url: false
---

## The design goal

The template engine for dout.dev had to satisfy three goals that usually pull in different directions.

**Readable like HTML.** A designer or a semantic-HTML purist should be able to open a template and see a document, not a programming language pretending to be markup. No curly-heavy logic on top of angle brackets.

**Expressive enough for a blog.** Real templates need conditionals, loops, nested layouts, and inline expressions. The minimum viable set has to cover those cases or the CMS ends up with special-case exports for every page.

**No `eval`.** Anything user-controlled that turns into runtime code is a liability. The expression evaluator had to parse and interpret, not delegate to the JavaScript engine.

The resulting engine is small, maybe a few hundred lines, and lives under `scripts/template-engine/`. It runs during the CMS build. It does not ship to the browser.

## The four primitives

The grammar has exactly four things.

**`<extends src="...">`** — a template declares that it extends a base layout. The base layout contains named slots.

**`<block name="...">`** — inside an extending template, a block overrides the same-named slot in the base layout.

**`<include src="...">`** — inline composition. The included fragment is inserted with access to the current context. Typical uses: the pagination component, the post card, the footer.

**`{{ expression | filter }}`** — an expression reference with optional filter pipeline. Filters are ordinary functions. The grammar for expressions supports member access, ternary, logical operators, and literal values.

Control flow is expressed with custom elements that look like HTML: `<if condition="...">`, `<for each="item in collection">`, `<switch>` with `<case>` and `<default>`. That keeps the templates in one grammar instead of mixing angle brackets with mustache-style blocks.

## How extends and blocks work

The engine parses the base layout once and indexes its blocks by name. When an extending template is rendered, the engine walks the child template, collects its `<block>` elements, and uses them to override the parent slots. Anything in the extending template outside of a block is discarded by design — it would have no stable place to land.

The practical upshot is that a post template reads like this:

```html
<extends src="./layouts/base.html">
  <block name="title">{{ title }} — dout.dev</block>
  <block name="content">
    <article>...</article>
  </block>
</extends>
```

The base layout declares the slots:

```html
<title><block name="title">dout.dev</block></title>
<main><block name="content"></block></main>
```

Slots can have default content. Blocks are required only if the parent says so.

## Expressions without eval

Expressions like `{{ post.coverWidth || '' }}` or `{{ tags.length > 0 }}` look like JavaScript. They are not — they are parsed into a small AST and walked by an interpreter.

The interpreter supports:

- literal values (strings, numbers, booleans, null);
- member access and optional chaining;
- arithmetic and comparison operators;
- logical `&&`, `||`, `!`;
- ternary conditional;
- function calls for a whitelisted set of filters.

Everything else is a syntax error. No global lookup, no prototype walk, no `Function` constructor. The evaluator is stateless and only reads from the context object passed in.

This matters for two reasons. First, it means rendering a template is deterministic and side-effect-free. Second, it means I can treat the template language as a safe expression surface, even when the inputs are derived from user content.

## Why custom elements for control flow

A common alternative is to use curly-brace blocks: `{% if %}`, `{% for %}`, `{% endfor %}`. I tried that. The mix of angle brackets and curlies made templates hard to read for non-trivial layouts. Using custom elements like `<if>` and `<for>` keeps the document shape consistent. Editors and formatters treat them as HTML; the indentation logic is obvious.

There is one rule I learned the hard way: do not nest `<if>` inside an opening tag to conditionally add attributes. The parser gets confused, and so does the reader. Use inline expressions in the attribute value instead:

```html
<img width="{{ post.coverWidth || '' }}" height="{{ post.coverHeight || '' }}" />
```

That rule is documented in the repository README, because it is one of those things that tripped me up twice before I wrote it down.

## What the engine does not do

It does not support runtime templates from untrusted content. It does not re-parse the base layout per render; that is cached. It does not allow templates to import JavaScript. It does not have a plugin system.

It does what a blog needs. The features I do not add are the features I do not have to maintain.

## The takeaway

If you are building a custom SSG and you want to keep the templates close to HTML, you do not need a big templating library. A few hundred lines of parser, a four-primitive grammar, a small set of filters, and a sandboxed expression interpreter covers the whole surface of a well-behaved blog.

The next post in the series walks through the design token layer and how the CSS stays simple.
