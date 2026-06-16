---
title: 'The End of Borrowed Abstractions'
date: '2026-06-16'
published: true
tags: ['architecture', 'ai', 'ai-copilot', 'vanilla-js', 'frontend', 'security']
series: ['The Future of Software', 'Bold Opinions']
description: 'AI is changing the economics of software abstraction: fewer borrowed runtime layers, more project rules, stronger standards, and code teams can understand, verify, and afford to change.'
canonical_url: false
---

## The reflex that shaped software

For the last twenty years, a large part of software development has been guided by a very simple reflex: when the platform feels too low-level, we install an abstraction.

At first, this was not only reasonable, it was necessary. Platforms were incomplete, browser behavior was inconsistent, standard libraries were often limited, and teams needed shared mental models to ship products at a human pace. Frameworks and libraries gave us vocabulary, structure, conventions, and a way to avoid solving the same problems over and over again.

The problem is that, over time, this useful reflex became almost automatic. Need UI composition? Install a framework. Need routing, state management, validation, forms, styling, animation, authentication glue, build orchestration, dependency injection, data fetching, queues, command handling, or configuration management? Install something.

Eventually, the product starts becoming only one part of the system. The other part is a carefully negotiated dependency graph, where every new feature has to pass through somebody else's assumptions, release cycle, architecture, migration path, documentation quality, security posture, and long-term maintenance choices.

This is not a frontend problem. It is not a JavaScript problem. It is not a React problem. It is not even a framework problem. It is a software problem.

Every ecosystem has its own version of this story. JavaScript has frontend frameworks and npm. Python has web frameworks, ML stacks, data tools, and long chains of packages. Java has decades of enterprise abstractions. .NET has its own layered ecosystems. PHP, Ruby, Go, Rust, Swift, Kotlin, and C# all have communities that build towers of convenience on top of native language and runtime features.

Again, this did not happen because developers were careless. It happened because abstractions are one of the main tools we have for dealing with complexity. Software is abstraction. The real question is not whether we should use abstractions, but where they should live, who should own them, how much of them should run in production, and whether borrowing them is still the best economic choice.

That question is becoming more urgent because the ground is moving. The next major abstraction layer may not be another framework. **The next major abstraction layer may be the model.**

## Frameworks were built for humans

Frameworks exist because humans need constraints. We need names, conventions, file structures, lifecycle models, shared patterns, and a limited number of concepts to keep in our heads at the same time. A framework is not just code. It is a cognitive compression format.

It tells us how to think about the system. Do not think about everything at once. Think in components, routes, controllers, models, hooks, stores, services, middleware, providers, modules, or pipelines. This is extremely useful when human developers are the only abstraction engine in the loop, because humans need stable shapes to coordinate work, communicate intent, and reduce ambiguity.

But LLMs do not need abstractions in exactly the same way.

A model does not care whether a pattern is called a hook, a provider, a composable, a bean, a service, a trait, a reducer, a module, or a pipeline. Those names still matter to us, because they help teams communicate and maintain the system, but they are not the deepest source of quality for AI-assisted software.

What a model needs is context. It needs constraints. It needs examples, tests, schemas, documentation, review rules, runtime signals, tool access, and clear success criteria. In other words, the most important abstraction for an AI-assisted codebase is not always the framework used by the application. It is the operational environment around the codebase.

That moves the center of gravity.

Instead of placing all best practices inside runtime abstractions, we can start placing more of them inside instructions, tests, static analysis, design tokens, architecture rules, accessibility checks, security policies, and project-specific agent skills. The abstraction is still there, but it is no longer necessarily something we ship to users or execute on every request.

This is a very different kind of software architecture.

## The new abstraction layer lives around the code

The next abstraction layer will increasingly be made of things that surround the code rather than things that always run inside it. MCP servers, agent skills, local LLMs, cloud LLMs, project-specific prompts, typed schemas, linters, formatters, test suites, static analysis, design tokens, accessibility rules, security policies, architecture decision records, code review agents, and documentation indexed as working memory all point in the same direction.

They create an environment where code can be generated, constrained, checked, refactored, and reviewed with more project awareness than before.

This does not mean we stop using abstractions. That would make no sense. It means we can stop shipping so many borrowed abstractions to production when their main value is no longer runtime behavior, but repetition, convention, scaffolding, and guidance.

A model can generate repetitive implementation. A linter can enforce a project rule. A type system can constrain a data shape. A test can verify behavior. An agent can apply the same refactor across many files. A design system can become tokens, fixtures, examples, and visual checks. A security rule can become a gate. An accessibility expectation can become part of the definition of done.

At that point, many dependencies start to look different. Some still provide deep value and should absolutely be used. Others begin to look less like leverage and more like inherited risk.

The question changes from "which library should we install?" to "should this be a dependency at all?"

## The dependency tax

Dependencies are not free. They increase bundle size, install time, build complexity, runtime surface, security exposure, version drift, documentation debt, maintenance overhead, and future migration cost.

Those are the obvious costs. The deeper cost is architectural.

Every dependency imports somebody else's decisions into your product. It brings assumptions about how problems should be modeled, how APIs should behave, how edge cases should be handled, and how the future should evolve. It becomes part of your onboarding path, hiring profile, debugging surface, security model, review process, and long-term roadmap.

The software industry loves reuse, and for good reason. Reuse can be powerful. But reuse is also coupling, and coupling has to be paid for.

The npm ecosystem makes this easy to see because it is large, fast-moving, and deeply interconnected, but the same dynamic exists in every ecosystem. Sonatype reported more than 454,600 new malicious packages identified throughout 2025 across major open-source ecosystems, bringing the cumulative total of known and blocked malware above 1.233 million packages. Research on npm supply-chain weak links also shows how package metadata, install scripts, expired maintainer domains, inactive maintainers, and account takeover opportunities can expose thousands of downstream packages.

This does not mean "never use dependencies". That would be a childish conclusion. It means dependencies must become deliberate architectural choices again. They should earn their place through real complexity, real specialization, real maintenance value, or real domain expertise.

They should not be the default answer to every small discomfort.

## AI changes the economics of code

For a long time, dependency-heavy development made economic sense. Writing everything in-house was expensive. Maintaining internal abstractions was expensive. Generating boilerplate was boring. Refactoring repeated patterns was slow. Documenting everything was painful. Testing every variation took time.

So we outsourced complexity to frameworks and libraries. We accepted the dependency tax because the alternative was often slower, more expensive, and more fragile.

AI changes that equation, not because it magically produces perfect software, but because it changes the cost of producing certain categories of code.

Stack Overflow's 2025 Developer Survey reports that 84% of respondents are using or planning to use AI tools, and 51% of professional developers use them daily. GitHub reported that nearly 80% of new developers on GitHub used Copilot within their first week in 2025. Controlled research on GitHub Copilot found that developers completed a JavaScript task 55.8% faster when using the tool.

The picture is not universally simple. Other studies are more nuanced, and they should be. AI coding tools are more useful in some contexts than others, and generated code still requires strong human review, especially in complex systems, proprietary codebases, security-sensitive areas, and large multi-file changes.

But the important point is not that AI writes perfect code. It does not.

The important point is that AI makes boilerplate, repetitive implementation, documentation, test scaffolding, migration work, refactoring, API adaptation, pattern replication, simple feature assembly, and codebase navigation cheaper than they used to be.

Those are exactly the categories of work that made teams install many libraries in the first place.

If a model can generate a project-specific implementation that follows your coding rules, passes your tests, respects your security constraints, uses your design tokens, and avoids unnecessary runtime dependencies, then the economics of abstraction change.

At that point, the question is no longer only "which package solves this?"

The better question becomes "why should this be a package?"

## Standards will matter more, not less

One of the common misunderstandings about AI-generated software is that it will make standards less important. I think the opposite is true.

AI will make standards more valuable because models work better when the target is stable, documented, widely used, and well represented. Language standards, platform APIs, protocol specifications, accessibility rules, security practices, and explicit architectural constraints are model-friendly.

A framework is a moving target controlled by a smaller community. A standard is a wider agreement.

On the web platform, we can already see this shift. Modern CSS is absorbing capabilities that once required preprocessors, JavaScript helpers, or framework-level conventions. Typed attr() lets CSS read attributes as typed values. CSS if() brings conditional logic into values. CSS custom functions aim to make reusable CSS logic native to the language.

When the platform learns these primitives, teams can use them directly only if their abstraction layers do not get in the way. Otherwise, the browser may already support the capability, but the product still has to wait for a framework, a library, a wrapper, a plugin, or a design system abstraction to catch up, expose it, document it, and stop fighting it.

That is one ecosystem, but the principle is broader. When platforms become more expressive, and AI becomes better at producing code against stable standards, the value of non-standard abstraction decreases.

The winning move is not to reject every framework. The winning move is to move as much product logic as possible toward stable, inspectable, standard primitives.

Use the language. Use the runtime. Use the platform. Use the framework when it still buys something real.

## Best practices become executable governance

Many teams use frameworks as delivery mechanisms for best practices. The framework tells them how to organize files, fetch data, render pages, place state, compose UI, and decide which patterns are acceptable.

In an AI-assisted workflow, many of those rules can move into configuration, automation, and project context.

Coding standards can become lint rules. Architecture decisions can become generation constraints. Design guidelines can become tokens and visual tests. Accessibility expectations can become automated checks. Security policies can become static analysis and dependency gates. Performance budgets can become CI failures. Reusable patterns can become agent skills. Project knowledge can become context the model can actually use.

This is a major change because best practices stop being trapped inside framework conventions and become executable governance.

A convention helps when developers remember it. A rule enforces it. A test verifies it. An agent applies it repeatedly. A model generates code from it.

That is the future shape of software abstraction. Not "everyone must memorize the framework", but "the system knows the rules and keeps applying them".

## The end of framework identity

The industry has spent years treating frameworks as identity. We say "I am a React developer", "I am a Laravel developer", "I am a Rails developer", "I am a Spring developer", "I am a Django developer", "I am a Next developer".

This made sense when frameworks were the main interface between developers and complexity. But in an AI-native development environment, that identity becomes too small.

The valuable skill will not be loyalty to a framework. The valuable skill will be understanding systems: language, runtime, platform, accessibility, security, performance, data, product constraints, and the way AI-generated work must be instructed, constrained, verified, and reviewed.

The senior developer of the next era is not the person who knows the most framework APIs by memory. It is the person who can design the rules of the system so that humans and models can safely produce good software together.

That requires more engineering, not less.

## This is not no-code

This future is not no-code. No-code pretends complexity can disappear, and complexity does not disappear. It moves.

What changes is the layer where engineering work happens. Less time wiring borrowed abstractions, more time defining contracts. Less time adapting to framework churn, more time designing durable systems. Less time installing packages for trivial problems, more time making sure the generated solution is correct, accessible, secure, observable, and maintainable.

AI does not remove the need for senior engineers. It increases the need for them.

Because when code becomes cheaper to produce, judgment becomes more valuable.

## A more vanilla world

"Vanilla" does not mean naive. It does not mean writing everything from scratch forever. It does not mean refusing tools, frameworks, libraries, or ecosystems.

It means preferring the native language, native runtime, and platform standards unless a dependency clearly earns its place.

A more vanilla world is not a world without abstraction. It is a world where abstraction is generated, governed, inspected, and owned. A world where dependencies are exceptions, not defaults. A world where libraries are chosen because they provide deep, hard, specialized value, not because nobody wanted to write twenty lines of code.

It is a world where frameworks are useful tools, not architectural religions. A world where the model becomes part of the abstraction layer, but the output remains understandable, standard, testable, and close to the platform.

This will not happen all at once. There will still be frameworks, libraries, ecosystems, and very good reasons to depend on external code. But the default is going to change.

The age of installing an abstraction for every small discomfort is ending.

The next era belongs to teams that can combine human judgment, platform standards, automated governance, and AI-generated implementation. Not because frameworks suddenly became useless, but because many of the reasons we needed them are being absorbed by something else.

The model is becoming part of the abstraction. The platform is getting stronger. The dependency graph is becoming a liability.

And software teams are about to rediscover a very old idea: the best code is not the code you borrowed. It is the code you understand, control, verify, and can afford to change.

## Sources

* [Sonatype, "The Evolving Software Supply Chain Attack Surface"](https://www.sonatype.com/state-of-the-software-supply-chain/2026/open-source-malware)
* [Zahan et al., "What are Weak Links in the npm Supply Chain?"](https://arxiv.org/abs/2112.10165)
* [Stack Overflow Developer Survey 2025, AI](https://survey.stackoverflow.co/2025/ai)
* [GitHub Octoverse 2025, "A new developer joins GitHub every second as AI leads TypeScript to #1"](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)
* [Peng et al., "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot"](https://arxiv.org/abs/2302.06590)
* [Pandey et al., "Transforming Software Development: Evaluating the Efficiency and Challenges of GitHub Copilot in Real-World Projects"](https://arxiv.org/abs/2406.17910)
* [MDN Web Docs, "attr() CSS function"](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/attr)
* [Chrome Developers, "CSS conditionals with the new if() function"](https://developer.chrome.com/blog/if-article)
* [W3C, "CSS Functions and Mixins Module"](https://www.w3.org/TR/css-mixins-1/)
