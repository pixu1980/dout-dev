---
title: 'Vibe Coding With Rigor: Orchestrating an AI Copilot Across 19 Milestones'
date: '2026-08-04'
published: false
tags: ['ai-copilot', 'making-of', 'architecture']
description: 'The workflow that kept Claude Code productive across the full dout.dev rebuild: small milestones, tight prompts, ruthless diff review, and rules about what never to delegate.'
canonical_url: false
---

## The term I am reclaiming

"Vibe coding" has become shorthand for "let the AI write whatever it wants and see what happens." That is not what I did on dout.dev, and it is not what the term should mean if it is going to be useful. The version I work with looks more like this:

> Vibe coding is **driving an AI copilot hard with clear intent, small units of work, and strict review, while keeping the architectural decisions in your own head.**

The vibe is the speed. The rigor is the review. This post is the workflow that made 19 milestones shippable without the repo turning into a science fair.

## The unit of work

Every session had one outcome. "Wire up the RSS feed." "Add the skip-link." "Extract the pagination component." Not "improve the site." Not "make it more accessible." The outcome fit in one commit.

That discipline mattered more than the prompt engineering. When a session has a scoped outcome, the copilot's proposals can be evaluated against a clear question: did this produce the outcome, and is the diff small? When a session is open-ended, every proposal feels plausible, and you accept changes you later regret.

## The prompt pattern I actually used

Three parts, in this order.

**State the goal and the constraint in one paragraph.** Not a task list. A paragraph that a smart colleague could act on cold. "I am adding a tag archive generator. It should produce `/tags/<slug>.html` for page 1 and `/tags/<slug>/<n>/` for subsequent pages. Must match the existing pagination contract. Do not touch the post template."

**Point at the files that matter.** "Read `scripts/cms/page-generator.js` and `src/components/pagination.html`. Mirror their conventions." Explicit pointers beat the copilot's guess about what is relevant.

**Name the done-state.** "Return the new file and the minimal diff to wire it up. Do not reformat unrelated code." Stating the shape of the output up front cuts down on scope creep.

That pattern saved me hours. The ones I got wrong were the ones where I vibed the prompt itself.

## What I delegated

Mechanical edits, exploratory scaffolding, documentation stubs, test harnesses, draft implementations I intended to rewrite. Roughly: anything where "a reasonable first version" had obvious shape and I wanted the time back.

A concrete example. The OG image generator needed 12 SVG templates for the various card states. Each was a small variation on the next. I described the first one, had the copilot produce it, reviewed, then asked for the remaining 11 with specific variations. That would have been an hour of tedium; it was ten minutes.

## What I did not delegate

- **Architecture.** Whether to build a template engine or adopt one. Whether to render OG images at build or runtime. Whether to ship a service worker at all.
- **Public API shape.** URL structure, front matter schema, CSS custom property naming.
- **Accessibility judgments.** When to use `aria-current`, when to rely on semantic HTML, how to test with a screen reader.
- **Any change I did not understand.** If a diff proposed a pattern I had not seen before, I made myself understand it before merging. If that took longer than the time saved, I wrote the code myself.

The last rule is the one that keeps the copilot from becoming technical debt generator.

## The review loop

Every diff got read line by line. Not "skimmed." Read. That is the work the copilot cannot do for you, and skipping it is how you end up with patterns that drift from the rest of the codebase.

Three review questions:

1. **Does this produce the outcome I asked for?** If not, throw the diff away and re-prompt. Do not "patch" a wrong starting point.
2. **Is this the smallest version that works?** The copilot adds defensive code, comments, error handling, and abstractions that are not needed. Ask for a simpler version. Repeatedly.
3. **Does this match the style of the rest of the codebase?** Consistency is cheap to enforce at review time and expensive to retrofit later.

Asking for simpler versions is the single highest-leverage feedback I give the copilot. "Make this boring." "Remove the try/catch." "This function does not need options." Boring is a feature.

## The mistakes that kept happening

- **Invented APIs.** Made-up flags, nonexistent methods. Less common on well-known libraries, more common on the boundary of the repo's own code.
- **Over-engineered error handling.** Defensive code for cases that cannot occur. I sent the diff back with "trust the caller" and the second version was always shorter.
- **Task-describing comments.** Comments like `// Fetch the user data from the server` above `fetchUser()`. Useless. I strip them on sight.
- **Unnecessary abstractions.** "Let me extract this helper" — usually no, three lines inline is better than an abstraction with one caller.

None of these are deal-breakers. They are the shape of what the copilot tends to produce when under-specified.

## The milestone rhythm

Each of the 19 milestones had a short document with the exit checklist. When the checklist was green, the milestone closed and I moved on. That structure, more than anything, kept the overall scope honest.

The alternative — a single rolling backlog with no exit criteria — is how personal projects stall. Without milestones I would have still been "polishing" after three months and not shipped the blog.

## What the copilot taught me about my own work

Two things I will keep after this project.

**Most of my hesitation is not about the hard choice.** It is about the tedium of implementing the choice. Delegating the tedium compresses the space between "I know what to do" and "it is done." That is not laziness; it is leverage.

**I am more opinionated than I thought.** When the copilot proposed something generic, I rejected it because it did not match the project's taste. I had to learn to articulate that taste explicitly — in prompts, in code comments, in README rules. Writing those articulations made the project more coherent.

## The takeaway

Vibe coding done well is not "let the AI drive." It is "drive harder, with better brakes." Small units of work, clear prompts, strict review, and a list of things you will never delegate. Hold that line and the copilot is a force multiplier. Drop it and you are doing unpaid editing for a confident junior engineer.

## References

- [Claude Code documentation](https://docs.claude.com/claude-code)
- [Working effectively with AI pair-programmers — Anthropic](https://www.anthropic.com/news)
- [Pair programming — Wikipedia](https://en.wikipedia.org/wiki/Pair_programming)
