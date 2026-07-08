---
title: 'Vibe Coding With Rigor (Or: How to Use AI Without Your Codebase Turning Into a Dumpster Fire)'
date: '2026-05-26'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'ai', 'workflow']
series: ['How I made it', 'Bold Opinions']
description: 'The milestone rhythm, prompting pattern, review loop, and delegation rules that kept the dout.dev rebuild disciplined while using a copilot. Yes, you can vibe AND have standards.'
canonical_url: false
---

## The term I am reclaiming (because "vibe coding" got a bad rap)

"Vibe coding" has become shorthand for "let the AI write whatever it wants and see what happens." That is NOT what I did on dout.dev, and it is not what the term should mean if it is going to be useful. The version I work with looks more like this:

> Vibe coding is **driving an AI copilot hard with clear intent, small units of work, and strict review, while keeping the architectural decisions in your own head.**

**The vibe is the speed. The rigor is the review.** This post is the workflow that made 19 milestones shippable without the repo turning into a science fair.

## The unit of work (one outcome, one commit)

Every session had one outcome. "Wire up the RSS feed." "Add the skip-link." "Extract the pagination component." NOT "improve the site." NOT "make it more accessible." The outcome fit in one commit.

That discipline mattered more than the prompt engineering. When a session has a scoped outcome, the copilot's proposals can be evaluated against a clear question: did this produce the outcome, and is the diff small? When a session is open-ended, every proposal feels plausible, and you accept changes you later regret.

## The prompt pattern I actually used (it's not that deep)

```markdown
Context: we are in a repo at <path>. The build system is <x>.
Task: <one specific thing>. 
Constraints: <rules the output must follow>.
Acceptance criteria: 
1. <checkable thing>
2. <checkable thing>
```

That's it. No system prompts. No "act as a senior engineer" preamble. The copilot does not need a persona; it needs context, a task, and constraints. The acceptance criteria are the most important part - they turn the output from "looks right" to "provably right."

## The review loop (read every diff)

I read every diff. Every single one. If the copilot produced 200 lines and I needed 40, I kept the 40 and deleted the rest. If the copilot produced a pattern that was technically correct but did not match the rest of the codebase, I rewrote it.

That is not a criticism of the copilot. It is the job. The copilot generates proposals; the engineer curates them. Anyone who skips the curation step is not engineering - they are editing.

## What I never delegated (the line in the sand)

Architecture. Naming. Accessibility semantics. The CSP. URL design. Whether a given feature should exist at all.

These stayed in my head. They are the difference between a codebase that is maintainable and a codebase that is "working" in the sense that a stopped clock is right twice a day.

## The takeaway

Vibe coding is not a license to abandon standards. It is a license to move faster while applying the same standards you would apply to a human pair programmer. Scope every session. Write acceptance criteria. Read every diff. Keep the architecture decisions in your own head.

Do that, and you can ship 19 milestones in weeks instead of months. Skip any of those, and you get a codebase that works today and is unfixable tomorrow.
