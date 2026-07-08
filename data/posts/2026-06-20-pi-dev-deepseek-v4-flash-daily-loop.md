---
title: 'Pi and DeepSeek V4 Flash: The Daily Coding Loop That Costs Almost Nothing'
date: '2026-06-20'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
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

And the entire thing is **open source at its core**. The repository at [github.com/earendil-works/pi](https://github.com/earendil-works/pi) is MIT-licensed, and everything - the core loop, the tool harness, the MCP bridge, the provider abstraction - is readable, forkable, and hackable. You can strip it down, patch it, or build your own distribution. There is no proprietary layer, no closed-source enterprise edition, no telemetry-gated feature. The CLI, the TUI, the extension system, and the skill loader are all there in plain TypeScript.

The consequence is that the extension API is unusually clean. Pi exposes a small, well-documented set of primitives - tools, MCP servers, skills, prompt templates, and themes - and you wire them together with a `package.json` and a single `main` file. The package manager (`pi packages`) discovers, installs, and updates extensions from [pi.dev/packages](https://pi.dev/packages/), where anyone can publish.

I maintain a small extension myself: [`@pixu1980/pi-path-picker`](https://pi.dev/packages/@pixu1980/pi-path-picker), a tool that autocompletes file paths inside the agent prompt. The source lives at [github.com/pixu1980/pi-coding-agent-extensions](https://github.com/pixu1980/pi-coding-agent-extensions), and the entire implementation - registering a custom tool, hooking into the prompt lifecycle, handling tab-completion in the TUI - fits in a handful of files. It is a good example of how little ceremony is involved: you write a TypeScript class, export it, publish it, and it works. No build step beyond TypeScript, no configuration wizard, no permission manifest.

The other thing Pi gets right is the provider model. It supports 20+ providers out of the box, including Anthropic, OpenAI, Google, xAI, Mistral, Groq, OpenRouter, and DeepSeek. DeepSeek is a first-class native provider because it speaks the OpenAI-compatible API, and you can switch models mid-session. The configuration lives in `~/.pi/agent/models.json` and you can register as many models as you want.

I have seven models registered at any given time. I switch between them depending on the task. The default for almost everything I do is DeepSeek V4 Flash.

## What DeepSeek V4 Flash actually is

DeepSeek V4 launched in preview on **April 24, 2026**, in two variants. V4-Pro is the flagship: 1.6T total parameters, 49B active, around $1.74 per million input tokens and $3.48 per million output tokens. V4-Flash is the cost-optimized tier: 284B total, **13B active per token**, 1M context window, 2,500 concurrent requests, and the pricing I quoted above.

The interesting design choice is the MoE split. 284B sounds enormous, but only 13B parameters run on any given token, which is what gives Flash its cost and latency profile. The model is not a "small model that tries to look big" - it is a properly sparse MoE that pays a small compute bill per token while still benefiting from a much larger knowledge base when routing. DeepSeek also uses a sparse attention scheme (CSA / HCA) to keep the 1M-context long-tail cheap, which is exactly what an agent loop needs.

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

## The closed-source trap I walked away from

Let me be direct, because the marketing is designed to obscure this.

**Cursor** is a VS Code fork with proprietary extensions glued to someone else's APIs. You do not own the loop, you do not own the integrations, and you pay a per-month subscription that rises without your consent. The model is venture-funded price suppression: lose money on every seat, make it up on the locked-in base when the music stops. The usual playbook.

**Claude Code** is a genuinely good tool harness owned by Anthropic, which means it exists to sell Anthropic models. You are not the customer of the tool - you are the inventory. The pricing is opaque, the model access is gated, and the open-source contributions are decorative. When Anthropic raises Opus pricing next quarter - and it will - your loop cost triples and you have no alternative provider to switch to within the same harness. That is not a product. That is **addiction by design**: low-dose introductory offer, price escalates after the habit forms.

**ChatGPT, GitHub Copilot, Codex** - all proprietary. All trained on public data the companies would never let you train on. All designed to make you dependent on a closed API that can change terms, pricing, or access at any time with zero recourse. The open-weight models from DeepSeek, Mistral, and Llama are structurally more aligned with your interest as a developer: you can run them, fork them, audit them, and switch between them without asking for permission.

**OpenCode** and the emerging ecosystem of open-agent toolkits are moving in the right direction: tools that assume you want transparency, portability, and the freedom to change the model without changing the harness. That is the principle that matters. Not "AI for everyone" as a slogan, but **"AI you control"** as a property of the software.

Pi is the only one of these that is open source at its core - MIT-licensed from day one, with a package registry where anyone can publish an extension without a review board or a commercial agreement. My `@pixu1980/pi-path-picker` is a small example, but the fact that I can write it, publish it, and use it without asking anyone is the entire difference between a platform and a prison.

### The extension potential is genuinely infinite

The most surreal part of this setup is that the model itself can write extensions for the harness that runs it.

DeepSeek V4 Flash reads the Pi extension documentation - a few pages of TypeScript interfaces and a `package.json` schema - and generates working extensions on the first try. I have done it. You describe what you want in plain English, the model reads the API docs from the repository, and it produces a complete extension: tool registration, prompt hooks, TUI integration, the whole thing. One prompt.

That is the loop squared. You use an open-source agent to call an open-weight model, and the model extends the agent while you watch. The harness grows its own capabilities. There is no approval queue, no marketplace gatekeeper, no SDK version lock. You just describe, generate, publish, and use.

It is incredible, it is satisfying, and it is the most empowering development workflow I have ever experienced. The ceiling is not set by a product manager's roadmap. The ceiling is set by what you can describe in a prompt.

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

* [pi.dev - official site](https://pi.dev/)
* [earendil-works/pi on GitHub](https://github.com/earendil-works/pi)
* [DeepSeek V4 Preview release notes (April 24, 2026)](https://api-docs.deepseek.com/news/news260424)
* [DeepSeek API - Models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
* [DeepSeek API - Integrate with Pi](https://api-docs.deepseek.com/quick_start/agent_integrations/pi_mono)
* [DeepSeek V4 Flash on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash)
* [Hugging Face - DeepSeek V4 blog post](https://huggingface.co/blog/deepseekv4)
* [HokAI - DeepSeek V4 Flash model profile](https://hokai.io/hub/models/deepseek-v4-flash)
* [Codersera - DeepSeek V4 Flash deep dive](https://codersera.com/blog/deepseek-v4-flash-deep-dive/amp/)
* [RunLocalAI - DeepSeek V4 Flash model profile](https://www.runlocalai.co/models/deepseek-v4-flash)
* [rohaquinlop/pi-deepseek-cache on GitHub](https://github.com/rohaquinlop/pi-deepseek-cache)
* [thetrebor/pi-reasonix on GitHub](https://github.com/TheTrebor/pi-reasonix)
* [Pi Review - Pick Right](https://pick-right.com/tools/pi/)
* [Xianpeng Shen - Writing an Article for Twenty-Four Cents: Pi + DeepSeek](https://shenxianpeng.github.io/en/posts/2026/pi-deepseek/)
