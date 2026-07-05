---
title: 'Pi and DeepSeek V4 Flash: The Daily Coding Loop That Costs Almost Nothing'
date: '2026-06-20'
published: true
tags: ['ai', 'workflow', 'tooling', 'making-of']
series: ['Bold Opinions', 'The Future of Software']
description: 'A minimalist open-source coding agent wired to a 13B-active MoE with 1M context: why this combination is now my default, how much it actually costs, and where the honest trade-offs live.'
canonical_url: false
---

## The headline numbers

I will get the math out of the way first, because the cost is the part that surprises people.

- **Pi** is an open-source terminal coding agent. MIT-licensed, written in TypeScript, four core tools (`read`, `write`, `edit`, `bash`) plus three opt-in read-only ones (`grep`, `find`, `ls`). No plan mode, no sub-agents, no permission popups, no IDE lock-in.
- **DeepSeek V4 Flash** is a 284B-parameter Mixture-of-Experts model with only 13B active per token, a 1M-token context window, and pricing that lands at **$0.14 per million input tokens** (cache miss), **$0.0028 per million input tokens** (cache hit), and **$0.28 per million output tokens** on the official API. Open weights, MIT license.
- A typical agent-loop session of mine reads, edits, and writes across a few hundred kilobytes of context, runs a few tool calls, and produces a few thousand tokens of reasoning. The bill is **fractions of a cent**.
- A heavy day, the kind where I ship two milestones and refactor a subsystem end-to-end, lands somewhere between **$0.30 and $0.90**.

That is the actual economic story of this combination. It is not a benchmark artifact. It is the loop I work in every day. This post is the full setup, the daily workflow, the cost math, the things it does not do well, and why I now treat it as the default.

## What pi.dev is, and what it deliberately is not

Pi is the work of Mario Zechner, now maintained under the `earendil-works` GitHub organization. It is a terminal-native coding harness: you run it, it reads your repo, it proposes edits, it runs shell commands, and you review every change before it lands on disk. The repository sits at around 66.5K stars, and it has a very strong opinion about what a coding agent should be.

The opinion is **minimalism without being stupid**.

Pi ships with exactly four core tools: `read`, `write`, `edit`, and `bash`. Three more, `grep`, `find`, and `ls`, are available as opt-in read-only tools. That is the entire built-in surface. Everything else is a TypeScript extension, a skill, a prompt template, or a theme. There is no plan mode because you can write a prompt template that asks the model to plan first. There is no sub-agent system because you can write a skill that delegates. There is no permission system because you are expected to read the diff before the model writes to disk.

That last point is the one most people miss. Pi does not remove safety. Pi removes **friction**. You still review every change. You still see the exact command before it runs. You still decide when the loop is done. What you give up is a layer of confirmation dialogs that, in my experience, do not actually catch the kind of mistakes that matter and mostly just slow down the parts of the work that are already correct.

The other thing Pi gets right is the provider model. It supports 20+ providers out of the box, including Anthropic, OpenAI, Google, xAI, Mistral, Groq, OpenRouter, and DeepSeek. DeepSeek is a first-class native provider because it speaks the OpenAI-compatible API, and you can switch models mid-session. The configuration lives in `~/.pi/agent/models.json` and you can register as many models as you want.

I have seven models registered at any given time. I switch between them depending on the task. The default for almost everything I do is DeepSeek V4 Flash.

## What DeepSeek V4 Flash actually is

DeepSeek V4 launched in preview on **April 24, 2026**, in two variants. V4-Pro is the flagship: 1.6T total parameters, 49B active, around $1.74 per million input tokens and $3.48 per million output tokens. V4-Flash is the cost-optimized tier: 284B total, **13B active per token**, 1M context window, 2,500 concurrent requests, and the pricing I quoted above.

The interesting design choice is the MoE split. 284B sounds enormous, but only 13B parameters run on any given token, which is what gives Flash its cost and latency profile. The model is not a "small model that tries to look big" — it is a properly sparse MoE that pays a small compute bill per token while still benefiting from a much larger knowledge base when routing. DeepSeek also uses a sparse attention scheme (CSA / HCA) to keep the 1M-context long-tail cheap, which is exactly what an agent loop needs.

On coding benchmarks, V4-Flash lands around **79% on SWE-bench Verified** and **96% on HumanEval** in third-party reporting, with a gap of about 1.6 percentage points to V4-Pro on SWE-bench Verified and around 1.9 points on LiveCodeBench. That is not the kind of gap I care about for the kind of work I do with it.

The other important fact is that V4-Flash ships under an **MIT license for the weights**. The API name is `deepseek-v4-flash`, the older `deepseek-chat` and `deepseek-reasoner` aliases retire on **July 24, 2026**, and the integration with Pi is officially documented on the DeepSeek API docs, not just tolerated.

## The daily loop

Here is the loop, condensed.

1. **Start the agent in the project root.** `pi` runs in the terminal, reads the project context, and shows me the current state of the working tree.
2. **State the outcome in one paragraph.** Not a task list. A paragraph a smart colleague could act on cold. "Refactor the search indexer to use a prebuilt JSON dataset. Match the conventions in `scripts/cms/_index.js`. Do not touch the post template. Return the new file and the minimal diff to wire it up."
3. **Let the agent run the tool loop.** It reads files, runs `pnpm test`, runs `pnpm lint`, edits the right places, and reports back. Most of my sessions are 5 to 20 tool calls.
4. **Read the diff.** This is the part I never skip. Pi shows me exactly what changed, in which files, and I approve, reject, or steer.
5. **Ship.** Commit, push, let CI do the rest.

The 1M context window matters more than I expected. Most of my projects are well under that, but the long-context behavior is what makes the agent loop feel cheap rather than expensive. When the model can hold the whole architecture in memory, it stops asking redundant questions, stops re-reading files, and stops producing context-degrading summaries of files it has already read.

## The cost math, in real numbers

Let me be specific, because vague cost claims are useless.

A typical milestone on dout.dev has been something like a CMS build step, a new template, or a content migration. The agent loop for one of those usually looks like:

- 200k–500k tokens of input across the session, most of which is the system prompt, the project context, and the files being read.
- 5k–20k tokens of output, which includes reasoning, diffs, and the final response.
- Most of those input tokens are **cache hits** after the first turn, because Pi re-sends the same system prompt and the same long project context on every iteration.

At the cache-miss rate, 500k input tokens cost **$0.07**. 20k output tokens cost **$0.0056**. Total: **$0.0756** before cache.

At the cache-hit rate for everything except the first turn, the same session lands closer to **$0.02–$0.04**. That is for a milestone that would have taken me hours and a significant amount of attention.

A heavy day, two milestones plus a refactor plus a documentation pass, has been landing somewhere in the **$0.30–$0.90** range. I have had monthly totals that look like rounding errors. I am not being clever about it. I just do not have to think about the meter.

There is also `pi-deepseek-cache`, a small extension that pins the system prompt and tool definitions to keep the prefix-cache hot, and the developer reports a 95%+ cache hit rate once the loop stabilizes. I have not measured my own hit rate that carefully, but I have watched my daily bill drop when I started using it, and the savings are real.

## What I stopped using

I am not going to pretend the alternatives do not work. They do. They are just more expensive in ways that matter at the personal-tooling scale.

- **Cursor and the heavy IDE agents.** Great for some workflows, expensive at the per-month subscription rate for the kind of agent-loop-heavy work I do, and they want to own the editor.
- **Claude Code and the Anthropic-native loops.** Excellent model, very good tool harness, but at Opus-class pricing, an output-heavy agent loop is roughly an order of magnitude more expensive than the same loop on V4-Flash, and for the work I do day-to-day the quality delta is not worth that multiplier.
- **ChatGPT-style web UIs.** Fine for one-shot questions. Useless for in-repo work, because the context does not survive a session and the tools are limited to copy-paste.

I am not saying these tools are bad. I am saying that for a developer who lives inside agent loops and who cares about the difference between a $0.30 day and a $5 day, the combination of Pi and DeepSeek V4 Flash is a structurally better default.

## The honest trade-offs

Nothing is free. Here is what I give up.

- **V4-Flash is still labeled Preview.** The model is fast, cheap, and very good, but the weights are still in the preview line and the API name change in July 2026 means I will need to update configuration at some point.
- **Pi does not babysit me.** No permission popups, no dry-run confirmation, no safe-mode. If I let the agent run a destructive command, it runs. This is a feature for me, but it is a sharp edge for someone used to a more guided harness.
- **No plan mode out of the box.** I write my own prompt template when I want a planning step. Some people will hate this. I do not, because I find that hardcoded plan modes get in the way of the kind of small, fast, in-the-flow work I do most of the time.
- **The model is Chinese-trained on a large multilingual corpus.** I do not consider this a trade-off, but it is a fact. V4-Flash is excellent at English, very good at the rest of the languages I touch, and explicitly licensed for commercial use.
- **Long-context reasoning still degrades past a point.** The 1M context is a budget, not a free pass. The agent loop is at its best when the relevant files are well within the first 200k–400k tokens, and the rest of the context is supporting material.

None of these trade-offs are dealbreakers for me. They are constraints I work with.

## Why this is the new default

Five years ago, the choice of a coding agent was a tooling preference. Today, it is a budget question, a workflow question, and a philosophical question.

Pi is a small, transparent, customizable harness that does not try to be my IDE, my project manager, or my safety net. It gives me a loop and gets out of the way. DeepSeek V4 Flash is a fast, open, properly sparse model that charges cents for what used to cost dollars. Together, they make the kind of agent-driven, multi-file, context-heavy work I do every day economically trivial.

I am not saying Pi + V4-Flash is the right answer for every team. A regulated environment, a large enterprise, a security-sensitive codebase, or a team that needs deep IDE integration will make a different choice. But for an independent developer who ships a lot, who reads every diff, who does not need permission popups, and who used to flinch at the monthly AI bill, the answer is: this loop, this model, this cost.

The model is becoming part of the abstraction layer. The agent harness is becoming part of the editor. The bill is becoming rounding error.

That is the new default. I am not going back.

## Sources

* [pi.dev — official site](https://pi.dev/)
* [earendil-works/pi on GitHub](https://github.com/earendil-works/pi)
* [DeepSeek V4 Preview release notes (April 24, 2026)](https://api-docs.deepseek.com/news/news260424)
* [DeepSeek API — Models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
* [DeepSeek API — Integrate with Pi](https://api-docs.deepseek.com/quick_start/agent_integrations/pi_mono)
* [DeepSeek V4 Flash on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash)
* [Hugging Face — DeepSeek V4 blog post](https://huggingface.co/blog/deepseekv4)
* [HokAI — DeepSeek V4 Flash model profile](https://hokai.io/hub/models/deepseek-v4-flash)
* [Codersera — DeepSeek V4 Flash deep dive](https://codersera.com/blog/deepseek-v4-flash-deep-dive/amp/)
* [RunLocalAI — DeepSeek V4 Flash model profile](https://www.runlocalai.co/models/deepseek-v4-flash)
* [rohaquinlop/pi-deepseek-cache on GitHub](https://github.com/rohaquinlop/pi-deepseek-cache)
* [thetrebor/pi-reasonix on GitHub](https://github.com/TheTrebor/pi-reasonix)
* [Pi Review — Pick Right](https://pick-right.com/tools/pi/)
* [Xianpeng Shen — Writing an Article for Twenty-Four Cents: Pi + DeepSeek](https://shenxianpeng.github.io/en/posts/2026/pi-deepseek/)
