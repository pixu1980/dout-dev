---
title: 'How to Write Agent Skills That Actually Trigger'
date: '2026-04-22'
published: true
tags: ['ai-copilot', 'architecture']
description: "Anthropic's guide to Claude skills is more useful than it first appears: the real lessons for agent skills are about routing, narrow workflows, progressive disclosure, deterministic checks, and testing activation separately from execution."
canonical_url: false
---

## The mistake most people make

Most bad skills are not bad because the instructions are weak. They are bad because the skill never loads at the right time, or loads for the wrong task.

That is the main point I took from Anthropic's PDF, [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf), and it is also the point the Medium summary by Ruqaiya Beguwala gets most right. The description field is not marketing copy. It is routing logic written in prose.

Anthropic's framing is Claude-specific, but the lesson generalizes cleanly to agent skills of any kind. A skill is not "a prompt you saved somewhere." A skill is packaged operational knowledge with an activation rule.

## A skill is a router, a playbook, and a reference pack

Anthropic defines a skill as a folder with an exact `SKILL.md` file plus optional `scripts/`, `references/`, and `assets/`. The useful idea is the three-level loading model:

- YAML frontmatter is always present and helps the model decide whether the skill applies.
- The `SKILL.md` body is the working playbook.
- Linked files are only loaded when needed.

That is a better mental model than "write one giant instruction file."

For agent design, I would translate it like this:

- the frontmatter or metadata is the routing layer;
- the main instructions are the execution layer;
- references and scripts are the depth layer.

If you collapse all three into one document, the skill gets harder to trigger, harder to maintain, and more expensive to load.

## Start with one hard task, not broad coverage

One of the better parts of the PDF is that Anthropic pushes two seemingly different ideas at once, and both are correct.

First, define 2-3 concrete use cases before you start. Second, iterate on one challenging task until the agent can do it reliably, then extract the pattern into a skill.

That is the right order.

Do not start with "project management assistant" or "software engineering copilot." Those are product categories, not skills. Start with something that has a visible outcome:

- create sprint tasks from current Linear state;
- review a database migration plan for rollout risk;
- turn a design handoff into implementation tasks across Figma, Drive, and Slack;
- generate a weekly research brief in a fixed format.

If the outcome is narrow, you can tell when the skill works. If the scope is broad, everything looks vaguely plausible and you ship prompt soup.

## Write the trigger sentence first

The most important field in the whole skill is still the description.

Anthropic's PDF is very explicit here: the description must say what the skill does and when to use it. It should include concrete trigger phrases users might actually say, stay under 1024 characters, and avoid XML angle brackets because the frontmatter lands in the system prompt.

The document also adds practical constraints that the summary article only mentions lightly:

- `SKILL.md` must be named exactly that, case-sensitive;
- the folder should be kebab-case;
- `README.md` does not belong inside the skill folder;
- names using `claude` or `anthropic` are reserved;
- optional fields like `compatibility`, `metadata`, and even `allowed-tools` exist in the reference appendix.

That level of specificity matters because skills fail for boring reasons more often than clever ones.

A good description looks more like an API contract than a slogan:

```yaml
---
name: db-migration-review
description: Reviews database migration plans, flags backward-compatibility and rollout risks, and proposes safe sequencing. Use when the user mentions schema changes, backfills, migrations, rollbacks, or zero-downtime deploys.
metadata:
  version: 1.0.0
---
```

This is specific about the outcome, the scope, and the trigger language. That is what gives the model a chance to route correctly.

## Instructions should be executable, not inspirational

Anthropic is also right about the body of the skill: vague verbs are useless.

"Validate the data before proceeding" is not an instruction. "Run `python scripts/validate.py --input {filename}` and stop on missing required fields or invalid dates" is an instruction.

The more critical the step, the less you should rely on ambiguous language. The PDF says this plainly in the troubleshooting section: for important checks, prefer a bundled validation script because code is deterministic and language interpretation is not.

That is one of the most transferable ideas in the whole guide.

A good skill body usually needs four things:

1. the ordered steps;
2. success conditions for each step;
3. examples of common requests;
4. troubleshooting for common failures.

A minimal structure is enough:

```markdown
# Database Migration Review

## Step 1: Read the migration plan
Inspect the schema change, expected rollout path, and rollback strategy.

## Step 2: Run deterministic checks
Execute scripts/check_migration.py --plan {filename}

## Step 3: Produce the review
Return risks, missing safeguards, recommended sequence, and rollback notes.

## Troubleshooting
Error: Migration plan missing rollback path
Solution: Stop and ask the user for rollback semantics before continuing
```

This is dull on purpose. Dull is good. Skills are operating manuals, not thought leadership.

One subtle PDF note is worth keeping: "take your time" style performance notes work better in the user prompt than in the skill file. That matches my experience with agent systems generally. Routing and workflow belong in the skill. Session-specific emphasis belongs in the prompt.

## Pick a pattern on purpose

The Anthropic PDF is strongest when it stops talking in abstractions and starts naming workflow patterns. It identifies five that show up repeatedly:

- sequential workflow orchestration;
- multi-MCP coordination;
- iterative refinement;
- context-aware tool selection;
- domain-specific intelligence.

That list is more useful than it sounds because each pattern implies a different structure.

A sequential onboarding skill wants strict step ordering and rollback rules. A multi-system handoff skill wants phase boundaries and shared state. An iterative report skill wants explicit quality thresholds and a stop condition. A context-aware storage skill needs a decision tree. A compliance skill needs governance before action.

If you mix these patterns without choosing one, the skill becomes mushy. It has tools, but no shape.

## Test activation, behavior, and value separately

The testing section in the PDF is better than most AI workflow docs because it separates three different questions.

First: does the skill trigger when it should? Anthropic suggests 10-20 obvious and paraphrased prompts, plus unrelated prompts that must not trigger. The rough target is 90% on relevant queries and 0% on clearly unrelated ones.

Second: does the skill actually do the job? Run the same request 3-5 times. Compare structure, tool calls, and failure handling. If results wander too much, the instructions are under-specified.

Third: is the skill better than not having the skill? Compare tool calls, token use, back-and-forth, and failed API calls. If the skill does not reduce friction or improve consistency, it is decorative.

The PDF also gives one debugging trick that is almost embarrassingly useful: ask the model, "When would you use the [skill name] skill?" The answer reflects the description back at you. If the answer is vague, the routing is vague.

This is also where the PDF goes beyond the Medium summary in practical detail. It recommends keeping `SKILL.md` under 5,000 words, moving deep material into `references/`, and being careful once you have 20-50 skills enabled at once. That is not a theoretical concern. Too many skills turn progressive disclosure back into context sludge.

## Distribution matters more than people think

The summary article focuses on the zip-and-upload flow, which is fine for Claude.ai. The PDF goes further and treats distribution as product work.

The recommended path is: host the skill on GitHub, keep a human-oriented `README` at the repo level, document why the skill plus your MCP integration are better together, and provide a quick-start guide with examples and screenshots.

That is the right instinct even outside the Claude ecosystem. If people cannot tell what outcome the skill produces, they will not install it. If the setup guide only talks about folders and YAML, you are describing mechanics instead of value.

The PDF also makes the API surface explicit. Skills can be managed through `/v1/skills`, attached through `container.skills`, and used through the Agent SDK, with the note that the Code Execution Tool beta is required. Even if you never touch Claude's API, the general lesson holds: skills are not just authoring artifacts, they are deployment artifacts.

## What I would keep if I were writing skills for any agent stack

The Anthropic guide is nominally about Claude skills, but most of its best advice is really about agent design in general.

I would keep five rules:

1. Write the routing sentence before the rest of the skill.
2. Build around one observable workflow, not a role description.
3. Keep the main file short and move depth into references or scripts.
4. Put deterministic validation in code whenever failure is expensive.
5. Test activation separately from execution and separately from business value.

The simplest way to say it is this:

> A good agent skill is not a prompt dump. It is a narrow workflow with strong routing, explicit steps, and enough structure to fail predictably.

That is the real takeaway from the PDF. The fancy part is not the packaging. The hard part is deciding what the agent should do, when it should do it, and what evidence counts as success.

## References

- [Ruqaiya Beguwala, "I Read Anthropic's Internal Guide on Building Claude Skills. Here's Everything You Need to Know."](https://generativeai.pub/i-read-anthropics-internal-guide-on-building-claude-skills-here-s-everything-you-need-to-know-b2b8606befb1)
- [Anthropic, "The Complete Guide to Building Skills for Claude" (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
