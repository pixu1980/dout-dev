---
title: 'Six Months With an AI Copilot: What I Delegate, What I Do Not'
date: '2026-11-03'
published: false
tags: ['ai-copilot', 'making-of', 'opinion']
description: 'A retrospective on six months of shipping with Claude Code as a pair programmer, what the division of labor actually looks like now, and the habits that survived.'
canonical_url: false
---

## The honest retrospective

The first post in this series framed the dout.dev rebuild around "an AI copilot that made the impossible shippable." Six months later, that framing is still true, but it is also more nuanced than I could say at the start. This is the retrospective.

Three audiences: developers considering serious AI-assisted work, skeptics who think the 10x claims are empty, and people somewhere in between.

## The division of labor, in specifics

Instead of abstract principles, here is the literal breakdown of tasks over the last six months on dout.dev.

**Tasks the copilot did the first draft of, and I edited heavily.**
- Template engine lexer (80% kept after editing)
- CMS normalization functions (60% kept; rewrote large chunks)
- Pagination component template (90% kept; small tweaks)
- RSS and JSON Feed generators (70% kept; schema corrections)
- OG image SVG templates (95% kept)
- Dozens of tests

**Tasks the copilot did mostly on its own, with spot-checks from me.**
- Repetitive refactors across dozens of files
- Renaming tokens in the design system
- Boilerplate docstrings (which I later deleted — more on that below)
- Search-and-explain across the repo

**Tasks I did without copilot help.**
- The architecture of the template engine grammar
- The CSP policy
- The URL structure for archives
- Accessibility decisions (focus traps, heading order, scrollspy behavior)
- The decision to write a custom syntax highlighter at all
- Every major trade-off call

**Tasks the copilot attempted and I rejected.**
- A lot of defensive error handling I did not want
- "Helper" abstractions with one caller
- Comments that restated the function name
- Proposals that contradicted earlier conventions in the codebase
- About half of its initial suggestions, probably

That last number is important. The copilot's first instinct is often not the right one for this project. The value is not in blind acceptance; it is in the speed of the iteration loop.

## The habits that survived

Five habits that started as experiments and stuck.

**Prompts are written as if for a colleague arriving cold.** Not a task list. A paragraph that states the goal, the constraints, the files to read. That is the highest-leverage single improvement I made.

**I always read the full diff.** No matter how small. Not skim, read. This is the contract that makes the copilot safe.

**I ask for smaller versions, repeatedly.** "Boring is a feature" has become a running joke in my own head. The first draft is always over-engineered.

**I do not delegate decisions.** The copilot is a good implementer. It is a mediocre decision-maker. When a decision needs judgment, I make it; the copilot executes.

**I keep units of work small.** One commit, one outcome. The moment a session drifts to "while we're here…" it is time to close it and start a new one.

## The habits that did not survive

Two things I tried and abandoned.

**Full-context prompts at the start of every session.** I used to paste 10,000 characters of relevant code into the opening prompt. It was overkill. The copilot is better than I gave it credit for at reading the files itself when pointed at them. Now my prompts are shorter and the copilot reads files as needed.

**Blind trust on well-known libraries.** Early on I assumed the copilot knew every library's API correctly. It does, mostly. But when it is wrong, the failure mode is confident fabrication. I now cross-check any unfamiliar flag or method in the actual docs.

## What the time savings actually look like

I will not give a 10x or 3x number, because "productivity" is not a single axis. Here are the four real numbers I have.

**Projects finished.** Without the copilot, my completion rate on side projects that reach "shippable" is approximately zero. With the copilot, I have finished one major project (dout.dev) and started two smaller ones. That is a meaningful delta, and it is not captured by commits-per-hour.

**Mechanical refactors per hour.** 10-20x faster. Rename this token, change this API signature, update every template to use the new include — these are the copilot's home turf.

**Novel-code per hour.** 1.5-2x faster at most. The copilot produces a first draft, I rewrite most of it, net speedup is modest. The value is in not staring at a blank file.

**Architectural decisions per hour.** Probably slower, if I am honest. The copilot wants to explore options and articulate tradeoffs, which is useful for writing them up but does not accelerate the decision.

The headline metric is "projects finished." Everything else is noise.

## The complaints

Three legitimate complaints I still have with the copilot.

**Over-commenting.** The copilot writes comments like `// Fetch the user data from the server` above `fetchUser()`. Useless. I delete them on sight. Asking for "no comments" in the prompt helps; not entirely.

**Refusing to not-handle edge cases.** If I ask for a function that handles a specific case, the copilot will often add a `try/catch` that swallows errors, because some training example once did that. The "trust the caller" rule I send back constantly.

**Mid-session drift.** Over a long session, the copilot gradually reintroduces patterns I rejected earlier. If the session is long enough, I see the same rejected suggestion twice. The fix is shorter sessions.

None of these are deal-breakers. All of them are the reason a human still reads every diff.

## The meta-lesson

The shape of working with an AI copilot is not "it codes, I review." It is "I drive, it accelerates." The accelerator does not know the destination. The direction is still mine.

That is reassuring if you were worried about AI taking over engineering. It is humbling if you hoped for a magical autopilot. Neither framing is complete, and six months in, I am more inclined to say: a good copilot is exactly what the word suggests. Second seat. Real help. Not the pilot.

## The takeaway

Six months later, the division of labor looks sustainable. I own decisions and architecture; the copilot handles the tedium of execution. Strict review is non-negotiable. Small units of work are non-negotiable. The habits that work are the ones that would work with any pair-programmer; they are amplified here because the partner is fast.

If you are considering this kind of workflow for real, my advice is: start with small scoped sessions, read every diff, and keep the list of things you will never delegate short and visible. Those three rules carry most of the benefit and avoid most of the harm.

## References

- [Claude Code](https://docs.claude.com/claude-code)
- [Anthropic engineering blog](https://www.anthropic.com/engineering)
- [AI-assisted coding study — GitHub](https://github.blog/news-insights/research/)
- [The limits of LLM-based code generation — academic survey](https://arxiv.org/list/cs.SE/recent)
