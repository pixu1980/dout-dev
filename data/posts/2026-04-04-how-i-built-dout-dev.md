---
title: How I Built dout.dev
date: 2026-04-04
published: true
tags: ['Architecture', 'Static Site', 'Design Systems', 'Accessibility']
description: A technical walkthrough of how dout.dev moves from markdown to an accessible, publishable static blog.
cover_image: ../assets/images/how-dout-dev-is-built-cover.jpg
cover_alt: Blue cover artwork titled How This Blog Is Built, used for the dout.dev making-of article
canonical_url: false
---

## The Goal: an editorial blog without runtime ballast

When I started reshaping dout.dev, I was not interested in repainting the theme and calling it done. I wanted to build an editorial system that stayed close to the native web: markdown content, readable HTML templates, CSS with real design tokens, and JavaScript used only where it delivers a clear benefit.

The guiding principle was simple: every part of the stack should do a precise job without turning the blog into an application that is more complex than the publishing problem actually requires.

## The pipeline: markdown in, static HTML out

The flow starts with the files in data/posts. Each article uses front matter for description, tags, cover image, publication date, and additional metadata. From there, the in-repo CMS reads the files, normalizes the data, and converts markdown into HTML.

Generating everything at build time lets me ship pages that are easy to host on GitHub Pages, with stable URLs, prerendered content, and no dependency on an application backend.

## A minimal CMS, but pointed in the right direction

The CMS does only a few things, but it does them consistently:

- it reads front matter;
- it generates slugs, excerpts, keywords, and indexes for tags, months, and series;
- it enriches article headings with ids and navigation data;
- it prepares data that is ready to feed templates, pages, and feeds.

That part matters because it moves complexity into the build step instead of pushing it into the browser.

## A template engine shaped around the project

Instead of adding a server-side rendering framework, I preferred a project-specific template engine with blocks, includes, loops, and conditionals. The syntax stays intentionally close to HTML so the templates remain readable even when the page logic becomes more layered.

The practical advantage is that components such as cards, headers, pagination, and post layouts can be reused without giving up control over the final markup. That becomes especially useful when you want to do semantic refactors or accessibility audits.

## Design system first, pages second

The CSS did not grow as a pile of local exceptions. I defined tokens, type scales, spacing, surfaces, focus states, and component relationships first. Only after that did I build the header, cards, article template, and archive views.

That approach makes the blog easier to evolve: if the density changes, a type family shifts, or panels need different behavior, the update starts from the foundation instead of from a chain of page-level patches.

## Accessibility as a project constraint

A large part of the work went into keyboard support, landmarks, semantics, and contrast. Posts now have focusable headings, a sidebar outline synchronized with scroll position, and quick shortcuts to reach the main content and the internal article navigation.

The goal was not to bolt ARIA labels onto the result after the fact, but to make sure the final markup is already sensible by default.

## Progressive enhancement, not client dependency

The interactive pieces exist, but they arrive after the document is already useful. Theme switching, reading preferences, client-side search, and the scrollspy all improve the experience without becoming prerequisites for reading the site.

If JavaScript never starts, the content is still available, structured, and navigable.

## The part that matters most: publishing without friction

In the end, everything converges on a build command that generates the static site, refreshes assets, and produces output that is ready to deploy. That lets me treat dout.dev like an editorial product: write, review, validate, and publish.

For me, the point is not using a fashionable stack. The point is having a pipeline that leaves room to focus on the writing and on a frontend quality bar that can actually be measured.

## What comes next

The foundation is finally in place: richer SEO, complete feeds, deeper accessibility passes, and more refinement in the editorial system are the natural next steps. The difference now is that each new milestone can land on a base that is much more solid and predictable.
