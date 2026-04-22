---
title: 'The Quality Gate, Local and in CI: Biome, Prettier, HTML and A11y Validation'
date: '2026-07-14'
published: false
tags: ['tooling', 'ci', 'architecture']
description: 'What runs before every merge on dout.dev, why the gate is strict, and the specific checks that catch the problems regressions usually cause.'
canonical_url: false
---

## Why the gate exists

A single-author blog does not need CI the way a team product does. But any site that accepts drive-by contributions, or any site that I want to be able to touch in six months without re-learning, benefits from a gate that answers one question at merge time:

> Does this change still produce a correct, accessible, valid site?

The gate on dout.dev is a single command, `pnpm quality:check`, that runs the same checks locally and in GitHub Actions. If it is green, the site is publishable. If it is red, it tells me which layer broke.

## What the gate actually runs

```bash
pnpm test
pnpm spellcheck
pnpm format:check
pnpm format:check:html
pnpm validate:all
```

Five commands, each doing one thing.

**`pnpm test`** — Node's built-in test runner on the CMS and template-engine code. Fast. No Jest, no Vitest, no configuration surface.

**`pnpm spellcheck`** — cspell against the markdown and HTML files. Catches typos in posts and navigation labels before they reach the reader.

**`pnpm format:check`** — Biome in check mode over JavaScript. Enforces the single formatter.

**`pnpm format:check:html`** — Prettier in check mode over HTML templates. HTML formatting is one of those things everyone forgets to verify until a diff becomes impossible to review.

**`pnpm validate:all`** — a composite of HTML validation, structural validation, link checking, and accessibility validation. The one that catches the most real bugs.

## HTML validation

HTML validation is underrated. Bad nesting, missing alt text, heading skips, unused IDs — all of these slip past manual review and all of them matter. The validator on dout.dev runs against every file under `src/` and `dist/` and reports problems with file and line.

```js
import { readFileSync } from 'node:fs';
import { HTMLHint } from 'htmlhint';

function validateHtml(file) {
  const rules = {
    'doctype-first': true,
    'tag-pair': true,
    'attr-lowercase': true,
    'attr-value-double-quotes': true,
    'alt-require': true,
    'id-unique': true,
    'title-require': true,
  };
  const source = readFileSync(file, 'utf8');
  return HTMLHint.verify(source, rules);
}
```

HTMLHint is not the only option. `@linthtml/linthtml` is similar. For deep validation the W3C Nu Validator is authoritative. For this project HTMLHint is enough.

## Link validation

Every internal link on the site gets resolved to an actual file at build time. A broken link in a post or in the navigation fails the build.

```js
function validateLinks(dir) {
  const failures = [];
  for (const file of walk(dir)) {
    const html = readFileSync(file, 'utf8');
    for (const href of extractHrefs(html)) {
      if (isInternal(href) && !exists(resolveToFile(href))) {
        failures.push({ file, href });
      }
    }
  }
  return failures;
}
```

External links are checked only occasionally, not on every build, because network flakiness should not fail a PR. A scheduled task runs external-link validation once a week.

## Accessibility validation

The a11y check runs axe-core over every generated page, using Playwright as the headless browser. It catches a significant fraction of WCAG issues automatically — missing labels, insufficient contrast, heading order problems, keyboard trap candidates.

```js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('posts pass axe', async ({ page }) => {
  await page.goto('/posts/2026-06-09-wcag-22-aa-without-aria-spam.html');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

Axe does not catch everything. Nothing does. What it catches is the base rate of failures that keep creeping in through drive-by edits.

## The one I added after getting burned

Early in the project, I shipped a build with a broken CSP meta tag. The page rendered; the browser silently refused to load the JavaScript. The fix is a build-time check that verifies the generated CSP is well-formed and covers the scripts referenced in the HTML.

```js
function validateCsp(html) {
  const csp = extractCspMeta(html);
  const scripts = extractInlineAndExternalScripts(html);
  const violations = scripts.filter((s) => !cspAllows(csp, s));
  return violations;
}
```

This is the kind of check you write exactly once, after exactly one production incident.

## The gate lives in one file

All of this is wired in `.github/workflows/deploy-pages.yml` as a single step:

```yaml
- name: Build site
  run: pnpm build

- name: Quality gate
  run: pnpm quality:check
```

Locally I run `pnpm quality:check` before any push. If I am about to merge something significant, I also run `pnpm test:visual` — the Playwright visual regression suite — which is slower and therefore not on the default path.

## What I did not add

- **No commit message linting.** I write commits in the shape I need; convention beats enforcement for a single-author repo.
- **No bundle size budget as a hard gate.** I check it occasionally with Lighthouse. It has never regressed enough to warrant a budget check.
- **No dependency update bot.** Dependabot PRs on a personal site are noise. I update manually when something actually needs updating.

## The takeaway

A quality gate is a contract with your future self. Write it once, keep it small, run it everywhere. The specific checks that matter depend on the project. For a static editorial site, HTML validity, link integrity, and axe-core accessibility cover most of what goes wrong.

## References

- [Biome](https://biomejs.dev/)
- [Prettier](https://prettier.io/)
- [HTMLHint](https://htmlhint.com/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Playwright](https://playwright.dev/)
- [W3C Nu HTML Checker](https://validator.w3.org/nu/)
