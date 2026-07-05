---
title: 'Quality Gate: Linting, Formatting, and Verify (Or: How I Stopped Shipping Broken HTML)'
date: '2026-05-19'
published: true
tags: ['making-of', 'tooling', 'linting', 'ci']
series: 'How I made it'
description: 'What runs before every merge on dout.dev: linting, formatting checks, HTML validation, accessibility validation, and dist verification. Yes, all of it.'
canonical_url: false
---

## Why the gate exists (because you will ship shit if you don't)

A single-author blog does not need CI the way a team product does. But any site that accepts drive-by contributions, or any site that I want to be able to touch in six months without re-learning, benefits from a gate that answers one question at merge time:

> Does this change still produce a correct, accessible, valid site?

The gate on dout.dev is a single command, **`pnpm quality:check`**, that runs the same checks locally and in GitHub Actions. If it is green, the site is publishable. If it is red, it tells me which layer broke. That's it. No excuses.

## What the gate actually runs (five commands, one purpose)

```bash
pnpm test
pnpm spellcheck
pnpm format:check
pnpm format:check:html
pnpm validate:all
```

Five commands, each doing one thing. No overlap. No ambiguity.

**`pnpm test`** — Node's built-in test runner on the CMS and template-engine code. Fast. No Jest, no Vitest, no configuration surface. Just tests.

**`pnpm spellcheck`** — cspell against the markdown and HTML files. Catches typos in posts and navigation labels BEFORE they reach the reader.

**`pnpm format:check`** — Biome in check mode over JavaScript. Enforces the single formatter.

**`pnpm format:check:html`** — Prettier in check mode over HTML templates. HTML formatting is one of those things everyone forgets to verify until a diff becomes impossible to review.

**`pnpm validate:all`** — a composite of HTML validation, structural validation, link checking, and accessibility validation. The one that catches the most real bugs.

## HTML validation (the one nobody does but everyone should)

HTML validation is underrated. Bad nesting, missing alt text, heading skips, unused IDs — all of these slip past manual review and all of them matter. The validator on dout.dev runs against every file under `src/` and `dist/` and reports problems with file and line.

```js
import { HTMLHint } from 'htmlhint';

function validateHtml(file) {
  const rules = {
    'doctype-first': true,
    'tag-pair': true,
    'attr-lowercase': true,
    'alt-require': true,
    'id-unique': true,
  };
  const source = readFileSync(file, 'utf8');
  return HTMLHint.verify(source, rules);
}
```

HTMLHint is not the only option. For deep validation the W3C Nu Validator is authoritative. For this project HTMLHint is enough. "Enough" is a feature.

## Link validation (every link, every build)

Every internal link on the site gets resolved to an actual file at build time. A broken link in a post or in the navigation FAILS the build.

External links are checked only occasionally, not on every build, because network flakiness should not fail a PR. A scheduled task runs external-link validation once a week.

## Accessibility validation (axe me anything)

The a11y check runs axe-core over every generated page, using Playwright as the headless browser. It catches a significant fraction of WCAG issues automatically — missing labels, insufficient contrast, heading order problems, keyboard trap candidates.

Axe does not catch everything. Nothing does. What it catches is the base rate of failures that keep creeping in through drive-by edits. That's good enough.

## The one I added after getting burned (we all have scars)

Early in the project, I shipped a build with a broken CSP meta tag. The page rendered; the browser silently refused to load the JavaScript. The fix is a build-time check that verifies the generated CSP is well-formed and covers the scripts referenced in the HTML.

This is the kind of check you write exactly once, after exactly one production incident. Learn from my pain.

## The gate lives in one file (single source of truth)

All of this is wired in `.github/workflows/deploy-pages.yml` as a single step:

```yaml
- name: Build site
  run: pnpm build

- name: Quality gate
  run: pnpm quality:check
```

Locally I run `pnpm quality:check` before any push. If I am about to merge something significant, I also run `pnpm test:visual` — the Playwright visual regression suite — which is slower and therefore not on the default path.

## What I did NOT add (because scope is a feature)

- **No commit message linting.** I write commits in the shape I need; convention beats enforcement for a single-author repo.
- **No bundle size budget as a hard gate.** I check it occasionally with Lighthouse. It has never regressed enough to warrant a budget check.
- **No dependency update bot.** Dependabot PRs on a personal site are noise. I update manually when something actually needs updating.

## The takeaway

A quality gate is a contract with your future self. Write it once, keep it small, run it everywhere. The specific checks that matter depend on the project. For a static editorial site, HTML validity, link integrity, and axe-core accessibility cover most of what goes wrong.

Ship shit, get paged. Gate your shit, sleep well.
