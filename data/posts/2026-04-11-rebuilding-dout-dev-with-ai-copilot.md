---
title: 'Rebuilding dout.dev With an AI Copilot: Less Boilerplate, Same Amount of Existential Dread'
date: '2026-04-11'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'ai', 'workflow']
series: 'How I made it'
description: 'What a copilot actually did during the dout.dev rewrite, what stayed on my keyboard, and what would have taken months without it. Actual numbers, not vendor bullshit.'
canonical_url: false
---

## The honest framing

I did not "ask an AI to build my blog." If that's what you heard, you've been reading too many LinkedIn posts from people who've never shipped a goddamn thing.

I rebuilt dout.dev as a hands-on engineering project and used an AI copilot the same way you'd use a very patient, very fast pair-programmer who happens to remember every file you ever pointed at. The difference from previous attempts is not that I wrote less code. It's that I spent far less time on the parts that used to drain the life out of me: boilerplate, repetitive refactors, sanity-checking conventions across hundreds of files, and the kind of careful mechanical work that makes a codebase consistent instead of a crime scene.

**What used to be a three-month weekend project compressed into a handful of focused sessions**, split across nineteen milestones. This is the tally. Real numbers. No business-speak.

## The milestones I actually shipped (yes, I kept track)

The roadmap is not a vague "rewrite" entry. It's a sequence of concrete, shippable units of work:

- M0-M2: repository bootstrap, template engine, and the in-repo CMS.
- M3-M7: layouts, post page, archives, universal pagination, home/about/404/playground/offline.
- M8-M10: responsive images, theming, client-side search.
- M11-M15: SEO and OG images at build time, feeds, progressive-enhancement micro-UX, accessibility pass, CSP.
- M17-M19: analytics (page hits only, I'm not a monster), CI/CD with preview on PR, quality and regression gate.

Each milestone had an exit checklist. When the list was green, I moved on. That discipline is what kept the AI useful instead of making it a distraction. Without it, you're just vibe-coding with extra steps.

## What the copilot did well (the honest part)

Three things carried most of the weight.

**Repeat-at-scale edits.** Rename a token across the design system, adjust heading semantics in dozens of templates, regenerate feed entries when the schema changes. I described the intent once and audited the diff afterwards. That's maybe a third of the total time I spent on the rewrite, and it's the part I would otherwise have abandoned out of sheer boredom.

**Search-and-explain inside the repo.** "Show me every place where we compute the canonical URL." "What renders the article sidebar and where does the scrollspy wire up?" I would have answered these questions eventually with ripgrep and memory. The copilot answered them in seconds and kept me in flow. Flow is expensive; interruption is the enemy.

**Drafts I could edit.** For the template engine, the CMS normalization, the OG image renderer, the archive paginator, I asked for a starting draft, read it, threw away the parts I did not like, and shaped the rest. That's faster than a blank file, and it's faster than copying-and-adapting something I half remember from a past project. It's like having a junior dev who never gets tired and never takes offense when you delete their code.

## What I did not delegate (because I have standards)

The architecture decisions. Whether to use a framework or build a template engine. Whether to render OG images with Sharp at build time or punt to a runtime service. Whether to accept an extra dependency for code highlighting or write a custom element. What "WCAG 2.2 AA" actually means in the post layout and how to verify it. The CSP. The information architecture of archives. The pagination URL shape.

I also did not delegate judgment on code quality. The copilot would happily write something that works; I read the diff and asked for a smaller, simpler, more boring version at least half the time. Boring is a feature. Boring code doesn't break at 2 AM.

## What it got wrong (because nothing is perfect)

It invented a nonexistent flag in a tool once. It occasionally produced patterns that passed tests but did not match the rest of the codebase. It sometimes wrote comments that described the task instead of the code. And it needed to be told, often, that adding error handling for an impossible case is worse than not adding it.

None of these are catastrophic. All of them are the reason a human still reads every diff. If you're not reading the diff, you're not engineering. You're gambling.

## The time I actually saved (real numbers, no bullshit)

Realistic estimate, without the copilot, for the nineteen milestones in the shape they landed: three to five months of evenings and weekends. With the copilot, driven hard with clear prompts and strict reviews: a handful of focused weeks. The ratio is not 10x and it's not 2x. It depends on the task. Mechanical refactors and exploratory scaffolding are much faster; architectural decisions and accessibility audits are not.

The more honest measure is that I FINISHED. The previous rewrites stalled around milestone M5 or M6, because the gap between "I can see the finish line" and "I have the energy to walk there" was too wide. The copilot didn't close that gap. It just made the middle part less soul-crushing.

## What actually changed

Writing posts is no longer a project. The pipeline turns markdown into a pre-rendered, accessible, fast page with feeds, sitemap, OG image, and comments - in the time it takes to run one build command. That's what nineteen milestones of engineering bought.

The rest of this series walks through each layer: what it does, why it's shaped that way, and where the tradeoffs landed. Read it or don't. I wrote it either way.
