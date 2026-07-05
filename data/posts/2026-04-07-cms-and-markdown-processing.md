---
title: 'CMS and Markdown Processing (Or: How I Learned to Stop Worrying and Love the Flat File)'
date: '2026-04-07'
published: true
tags: ['making-of', 'cms', 'markdown', 'static-site']
series: 'How I made it'
description: 'How dout.dev turns markdown front matter into normalized post data, sanitized HTML, archive indexes, and generated pages. Without losing your fucking mind.'
canonical_url: false
---

## The useful distinction

There's this OpenReplay piece, [The Good And Bad Of Using Markdown As A CMS](https://blog.openreplay.com/markdown-cms-pros-cons/), that makes a point more important than it sounds. "Markdown as a CMS" can mean at least three completely different things:

- plain `.md` files in a repository (what I do);
- MDX tied to a framework runtime and component model (what psychopaths do);
- a Git-backed editorial tool that stores content as Markdown (what people who compromise do).

*Those are related, but they are NOT the same fucking thing.* The trade-offs change with each one.

On dout.dev, the setup is plain Markdown plus front matter, a custom CMS pipeline, and an HTML-native template engine. No MDX. No admin UI. No database. That choice is perfect for some problems and the wrong answer for others. Knowing the difference is what they pay me for.

## Where Markdown is still the right answer (spoiler: almost always for nerds)

For developer-owned content, Markdown is still the goddamn king.

The obvious reason is version control. A post is a text file in Git. Diffs are readable. Rollback is trivial. Branches and pull requests already are the review workflow. If the site generator changes in five years, the content survives because the format isn't proprietary bullshit.

The less obvious reason is maintenance. Raw HTML content ages like milk. Inline styles accumulate like dust. Broken nesting sneaks in like a cockroach. One-off classes appear for formatting hacks. Markdown constrains the authoring surface on purpose, and that constraint is usually a feature, not a bug.

For a blog, documentation site, changelog, or engineering handbook, this is a strong fit. The people writing are usually the same people maintaining the build, and the content is mostly narrative rather than highly relational data. If you're running a blog with a database, you're either making money off it or you enjoy pain.

## Where plain Markdown stops being a CMS (the honest part)

The OpenReplay article is right about the breaking points. I'm not too proud to admit it.

Plain files don't give you content relationships for free. "Posts by author", "localized variants", "schedule this for next Tuesday", "send it through approval", "let marketing edit it without Git" — none of that is inherent in Markdown. At that point Markdown is a storage format, not the whole publishing system.

This is also where a lot of Markdown debates get sloppy. People say "Markdown cannot do X" when what they really mean is "a directory full of `.md` files without surrounding tooling cannot do X." That's true. It's also incomplete, because a project can add a lot of structure around Markdown before it reaches for a headless CMS. Like, say, a custom pipeline with actual engineering behind it.

## What dout.dev adds on top of Markdown (the part where I justify my salary)

dout.dev is NOT "just Markdown files in a repo." If that's what you think, you haven't been paying attention.

The CMS layer reads front matter, normalizes content, derives slugs, builds tag/month/series datasets, and generates pages from those derived records. The renderer also builds feeds, search data, and OG images. The image pipeline turns a normal Markdown image into a responsive `<picture>` with WebP sources, known dimensions, lazy loading, and a `<noscript>` fallback. Pull requests also get a built preview artifact, which is enough for review even though the site stays fully static.

That changes the shape of the problem. For this project, Markdown is the authoring format but the CMS is the surrounding pipeline: content normalization, derived relationships, image processing, deterministic HTML output, validation and CI before publish. Structured taxonomies exist. Media handling exists. Preview exists. Parser behavior is consistent because there's ONE Markdown pipeline, not a grab bag of parsers that interpret the same syntax differently.

## What dout.dev still doesn't pretend to solve (the honest part)

The system is better than plain files alone, but it's still intentionally narrow. Like a tailored suit.

It's NOT a good fit for non-technical editors. There's no admin UI. The workflow is still Git-first. If your mom needs to publish recipes, this ain't it.

It's NOT a good fit for approval-heavy editorial teams. There are drafts through `published: false`, local watch mode, and CI preview artifacts, but there's no role model, no approval chain, and no true scheduled publishing workflow today. It's just me and my opinions.

It's NOT a good fit for localization-heavy content. The site is English-only, and that's a product decision as much as a technical one. I speak English. The site speaks English. We're both happy.

It's NOT a good fit for dynamic or highly relational domains. Comments can be outsourced to Giscus, search can be client-side, and analytics can be added carefully. But if the core content is products, inventory, user-generated data, or frequently mutating records, a database-backed CMS or API is the correct tool. Use the right tool for the job, you animals.

This is the part worth being honest about: dout.dev bypasses some Markdown problems by adding custom infrastructure, but it does not magically turn Markdown into a universal CMS. Anyone who tells you otherwise is selling something.

## When to use which (the executive summary)

Use Markdown when the content is text-first, developer-owned, and benefits from living next to the code. Use a headless CMS when the content is structured, multi-author, localized, workflow-heavy, or owned by people who should never have to think about Git.

For dout.dev, Markdown is the right source format: single author, strong opinions about portability and static output, content that is mostly narrative. For a marketing team, product catalog, or newsroom, I would not stretch this model. I'd use something else and sleep better.

**Markdown is a fantastic source format.** It's sometimes a CMS. It's never ALL of the CMS by itself. Anyone who tells you different is trying to sell you a $10,000 conference ticket.

## References

- [OpenReplay Team, "The Good And Bad Of Using Markdown As A CMS"](https://blog.openreplay.com/markdown-cms-pros-cons/)
- [Tina CMS](https://tina.io/)
- [Decap CMS](https://decapcms.org/)
