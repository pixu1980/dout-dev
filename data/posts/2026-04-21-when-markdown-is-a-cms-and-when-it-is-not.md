---
title: 'When Markdown Is a CMS, and When It Is Not'
date: '2026-04-21'
published: true
tags: ['architecture', 'markdown', 'static-site']
description: 'A practical look at where a Markdown-driven publishing workflow shines, where it breaks down, and how dout.dev pushes the model further without pretending it is a universal CMS.'
canonical_url: false
---

## The useful distinction

A recent OpenReplay piece, [The Good And Bad Of Using Markdown As A CMS](https://blog.openreplay.com/markdown-cms-pros-cons/), makes a distinction that matters more than it first sounds. "Markdown as a CMS" can mean at least three different systems:

- plain `.md` files in a repository;
- MDX tied to a framework runtime and component model;
- a Git-backed editorial tool that stores content as Markdown.

Those are related, but they are not the same thing. The trade-offs move with each one.

On dout.dev, the setup is plain Markdown plus front matter, a custom CMS pipeline, and an HTML-native template engine. No MDX. No admin UI. No database. That choice is excellent for some problems and the wrong answer for others.

## Where Markdown is still the right answer

For developer-owned content, Markdown remains hard to beat.

The obvious reason is version control. A post is a text file in Git. Diffs are readable. Rollback is trivial. Branches and pull requests already are the review workflow. If the site generator changes in five years, the content survives because the content format is not proprietary.

The less obvious reason is maintenance. Raw HTML content ages badly. Inline styles accumulate. Broken nesting sneaks in. One-off classes appear for formatting hacks. Markdown constrains the authoring surface on purpose, and that constraint is usually a feature.

For a blog, documentation site, changelog, or engineering handbook, this is a strong fit. The people writing are usually the same people maintaining the build, and the content itself is mostly narrative rather than highly relational data.

## Where plain Markdown stops being a CMS

The OpenReplay article is right about the breaking points.

Plain files do not give you content relationships for free. "Posts by author", "localized variants", "schedule this for next Tuesday", "send it through approval", "let marketing edit it without Git" - none of that is inherent in Markdown. At that point Markdown is a storage format, not the whole publishing system.

This is also where a lot of Markdown debates get sloppy. People say "Markdown cannot do X" when what they really mean is "a directory full of `.md` files without surrounding tooling cannot do X." That is true. It is also incomplete, because a project can add a lot of structure around Markdown before it reaches for a headless CMS.

## What dout.dev adds on top of Markdown

dout.dev is not "just Markdown files in a repo."

The CMS layer reads front matter, normalizes content, derives slugs, builds tags, month archives, and series datasets, and generates pages from those derived records. The renderer also builds feeds, search data, and OG images. The image pipeline turns a normal Markdown image into a responsive `<picture>` with WebP sources, known dimensions, lazy loading, and a `<noscript>` fallback. Pull requests also get a built preview artifact, which is enough for review even though the site stays fully static.

That changes the shape of the problem. For this project, Markdown is the authoring format, but the CMS is the surrounding pipeline:

- content normalization;
- derived relationships such as tags, months, series, and post navigation;
- image processing and metadata extraction;
- deterministic HTML output through the template engine;
- validation and CI before publish.

This is enough to bypass several of the usual complaints about Markdown-based publishing on a personal site. Structured taxonomies exist. Media handling exists. Preview exists. Parser behavior is consistent because there is one Markdown pipeline.

## What dout.dev still does not pretend to solve

The system is better than plain files alone, but it is still intentionally narrow.

It is not a good fit for non-technical editors. There is no admin UI. The workflow is still Git-first.

It is not a good fit for approval-heavy editorial teams. There are drafts through `published: false`, local watch mode, and CI preview artifacts, but there is no role model, no approval chain, and no true scheduled publishing workflow today.

It is not a good fit for localization-heavy content. The site is English-only, and that is a product decision as much as a technical one.

It is not a good fit for dynamic or highly relational domains. Comments can be outsourced to Giscus, search can be client-side, and analytics can be added carefully. But if the core content is products, inventory, user-generated data, or frequently mutating records, a database-backed CMS or API is the correct tool.

This is the part worth being honest about: dout.dev bypasses some Markdown problems by adding custom infrastructure, but it does not magically turn Markdown into a universal CMS.

## The practical rule

The rule I would use is simple.

Use Markdown when the content is text-first, developer-owned, and benefits from living next to the code. Use a headless CMS when the content is structured, multi-author, localized, workflow-heavy, or owned by people who should never have to think about Git.

For dout.dev, Markdown is still the right source format because the project is a single-author editorial system with strong opinions about portability, accessibility, and static output. For a marketing team, product catalog, or newsroom, I would not stretch this model beyond its natural limits.

Markdown is a great source format. It is sometimes a CMS. It is never all of the CMS by itself.

## References

- [OpenReplay Team, "The Good And Bad Of Using Markdown As A CMS"](https://blog.openreplay.com/markdown-cms-pros-cons/)
- [Tina CMS](https://tina.io/)
- [Decap CMS](https://decapcms.org/)
