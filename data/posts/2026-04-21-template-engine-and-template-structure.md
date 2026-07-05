---
title: 'Template Engine and Template Structure (Or: Why I Didn''t Use Handlebars Like a Normal Person)'
date: '2026-04-21'
published: true
tags: ['making-of', 'template-engine', 'html', 'architecture']
series: 'How I made it'
description: 'How dout.dev handles layouts, blocks, includes, and expressions without a runtime framework. And no, I didn''t use eval.'
canonical_url: false
---

## Three constraints that shaped the grammar (because constraints are good, actually)

Three constraints that usually pull in different directions. Like a tug of war where everyone's right.

**Readable LIKE HTML.** A template should look like a document, not a programming language wearing angle brackets. No curly-heavy logic mixed into markup. If I wanted PHP, I'd use PHP.

**Expressive enough for a real blog.** Conditionals, loops, nested layouts, inline expressions — the minimum viable set has to cover these or the CMS ends up exporting special-case data structures for every page type. And I'm lazy, so I want fewer page types.

**No `eval`.** Anything user-controlled that turns into runtime code is a liability. The expression evaluator had to parse and interpret, not delegate to the JavaScript engine. `eval` is the devil, and I don't make deals with the devil.

**The resulting engine is a few hundred lines** and lives under `scripts/template-engine/`. It runs during the CMS build. It does NOT ship to the browser. Because nothing that ships to the browser should be trusted.

## The four primitives (that's it, just four)

The grammar has exactly four things. That's the whole language.

**`<extends src="...">`** — a template declares that it extends a base layout. The base layout contains named slots. Like inheritance, but without the existential crisis.

**`<block name="...">`** — inside an extending template, a block overrides the same-named slot in the base layout. Simple. Predictable.

**`<include src="...">`** — inline composition. The included fragment is inserted with access to the current context. Typical uses: the pagination component, the post card, the footer. You know, stuff you don't want to repeat.

**Expression references** — an expression reference can use an optional filter pipeline. Filters are ordinary functions. The grammar for expressions supports member access, ternary, logical operators, and literal values. No, you can't execute arbitrary code. Yes, that's on purpose.

Control flow is expressed with custom elements that look like HTML: `<if condition="...">`, `<for each="item in collection">`, `<switch>` with `<case>` and `<default>`. That keeps the templates in ONE grammar instead of mixing angle brackets with mustache-style blocks. Consistency is a feature.

## How extends and blocks work (the boring but important part)

The engine parses the base layout once and indexes its blocks by name. When an extending template is rendered, the engine walks the child template, collects its `<block>` elements, and uses them to override the parent slots. Anything in the extending template outside of a block is discarded by design — it would have no stable place to land. Like my uncle's advice.

The practical upshot is that a post template reads like this:

```html
<extends src="./layouts/base.html">
  <block name="title">Title from context - dout.dev</block>
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

Slots can have default content. Blocks are required only if the parent says so. It's like a contract between templates.

## Expressions without eval (because I'm not a psychopath)

Expressions for values like post cover dimensions or tag counts look like JavaScript. They are NOT JavaScript — they are parsed into a small AST and walked by an interpreter. Like a tiny court judge for strings.

The interpreter supports:

- literal values (strings, numbers, booleans, null);
- member access and optional chaining;
- arithmetic and comparison operators;
- logical `&&`, `||`, `!`;
- ternary conditional;
- function calls for a whitelisted set of filters.

Everything else is a syntax error. No global lookup, no prototype walk, no `Function` constructor. The evaluator is stateless and only reads from the context object passed in. It's sandboxed tighter than a cargo ship container.

This matters for two reasons. First, it means rendering a template is deterministic and side-effect-free. Second, it means I can treat the template language as a safe expression surface, even when the inputs are derived from user content. Security by fucking design.

## Why custom elements for control flow

A common alternative is to use curly-brace blocks for conditionals, loops, and closing statements. I tried that. It sucked. The mix of angle brackets and curlies made templates hard to read for non-trivial layouts. Using custom elements like `<if>` and `<for>` keeps the document shape consistent. Editors and formatters treat them as HTML; the indentation logic is obvious. Your syntax highlighter doesn't have an aneurysm.

There is one rule I learned the hard way: do NOT nest `<if>` inside an opening tag to conditionally add attributes. The parser gets confused, and so does the reader. Use inline expressions in the attribute value instead:

```html
<img width="expression: cover width or empty" height="expression: cover height or empty" />
```

That rule is documented in the repository README, because it's one of those things that tripped me up twice before I wrote it down. Learn from my pain.

## What the engine does not do (the features I didn't add)

It does not support runtime templates from untrusted content. It does not re-parse the base layout per render; that is cached. It does not allow templates to import JavaScript. It does not have a plugin system.

It does what a blog needs. The features I do not add are the features I do not have to maintain. And maintaining features you don't need is how open source projects die.

## The takeaway

If you are building a custom SSG and want templates that read like HTML, you do not need a full templating library. A few hundred lines of parser, a four-primitive grammar, a small set of filters, and a sandboxed expression interpreter covers the whole surface of a well-behaved blog. The features you do not add are the features you do not have to maintain. Repeat that until it sticks.
