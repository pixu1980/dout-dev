---
title: 'Rebuilding dout.dev in Weeks With an AI Copilot'
date: '2026-04-28'
published: false
tags: ['architecture', 'static-site', 'vanilla-js', 'ai-copilot', 'making-of']
description: 'What an AI copilot actually did during the rewrite of dout.dev, what I kept on my own keyboard, and a candid tally of what would have taken months without it.'
canonical_url: false
---

## The honest framing

I did not "ask an AI to build my blog." I rebuilt dout.dev as a hands-on engineering project and used an AI copilot the same way you would use a very patient, very fast pair-programmer who happens to remember every file you pointed at. The difference from previous attempts is not that I wrote less code. It is that I spent far less time on the parts that used to drain me: boilerplate, repetitive refactors, sanity-checking conventions across hundreds of files, and the kind of careful mechanical work that makes a codebase consistent.

What used to be a three-month weekend project compressed into a handful of focused sessions, split across nineteen milestones. This is the tally.

## The milestones I actually shipped

The roadmap is not a vague "rewrite" entry. It is a sequence of concrete units of work:

- M0–M2: repository bootstrap, template engine, and the in-repo CMS.
- M3–M7: layouts, post page, archives, universal pagination, home/about/404/playground/offline.
- M8–M10: responsive images, theming, client-side search.
- M11–M15: SEO and OG images at build time, feeds, progressive-enhancement micro-UX, accessibility pass, CSP.
- M17–M19: analytics (page hits only), CI/CD with preview on PR, quality and regression gate.

Each milestone had an exit checklist. When the list was green, I moved on. That discipline is what kept the AI useful instead of making it a distraction.

## What the copilot did well

Three things carried most of the weight.

**Repeat-at-scale edits.** Rename a token across the design system, adjust heading semantics in dozens of templates, regenerate feed entries when the schema changes. I described the intent once and audited the diff afterwards. That is maybe a third of the total time I spent on the rewrite, and it is the part I would otherwise have abandoned.

**Search-and-explain inside the repo.** "Show me every place where we compute the canonical URL." "What renders the article sidebar and where does the scrollspy wire up?" I would have answered these questions eventually with ripgrep and memory. The copilot answered them in seconds and kept me in flow.

**Drafts I could edit.** For the template engine, the CMS normalization, the OG image renderer, the archive paginator, I asked for a starting draft, read it, threw away the parts I did not like, and shaped the rest. That is faster than a blank file, and it is faster than copying-and-adapting something I half remember from a past project.

## What I did not delegate

The architecture decisions. Whether to use a framework or build a template engine. Whether to render OG images with Sharp at build time or punt to a runtime service. Whether to accept an extra dependency for code highlighting or write a custom element. What "WCAG 2.2 AA" actually means in the post layout and how to verify it. The CSP. The information architecture of archives. The pagination URL shape.

I also did not delegate judgment on code quality. The copilot would happily write something that works; I read the diff and asked for a smaller, simpler, more boring version at least half the time. Boring is a feature.

## What it got wrong

It invented a nonexistent flag in a tool once. It occasionally produced patterns that passed tests but did not match the rest of the codebase. It sometimes wrote comments that described the task instead of the code. And it needed to be told, often, that adding error handling for an impossible case is worse than not adding it.

None of these are catastrophic. All of them are the reason a human still reads every diff.

## The time I actually saved

Realistic estimate, without the copilot, for the nineteen milestones in the shape they landed: three to five months of evenings and weekends. With the copilot, driven hard with clear prompts and strict reviews: a handful of focused weeks. The ratio is not 10x and it is not 2x. It depends on the task. Mechanical refactors and exploratory scaffolding are much faster; architectural decisions and accessibility audits are not.

The more honest measure is that I finished. The previous rewrites stalled around milestone M5 or M6, because the gap between "I can see the finish line" and "I have the energy to walk there" was too wide.

## What this unlocks

Now that the foundation is in place, writing posts is not a tax. The pipeline turns markdown into a pre-rendered, accessible, fast page with feeds, sitemap, OG image, and comments. That is the point. The engineering was the warm-up. The blog is the thing.

The next posts in this series walk through each layer of that pipeline, what I reused, what I rebuilt, and why.
