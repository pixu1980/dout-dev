---
title: 'Manual A11y Audit: axe, Keyboard, Screen Reader in an Afternoon'
date: '2026-11-10'
published: false
tags: ['accessibility', 'a11y', 'tooling']
description: 'A reproducible accessibility audit for a static blog: axe for the automated pass, keyboard-only for interaction, screen reader for announcement correctness. Under four hours.'
canonical_url: false
---

## The claim

An accessibility audit is not a three-week project. For a static blog of reasonable size, a complete manual audit — automated scan plus keyboard-only pass plus screen reader pass — fits in one afternoon. This post is the protocol I use.

Three passes. Each catches a different class of problem. None replaces the others.

## Pass 1: axe, in the browser

Axe-core is the de facto standard for automated a11y checks. It catches mechanical violations — missing labels, contrast failures, heading order skips, ARIA misuse, missing alt text, keyboard traps in known patterns. What it does not catch is semantic correctness and interaction-level issues.

Time budget: 30 minutes for a small site.

The easiest way to run axe is the browser extension. Install it, open DevTools, Scan. For deterministic reruns, the axe Chrome extension exports a JSON report; if you want CI integration, use the Playwright or Puppeteer bindings.

```js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('home passes axe', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  const violations = await checkA11y(page, null, {
    detailedReport: true,
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] } },
  });
  expect(violations).toBeFalsy();
});
```

Common findings on a first-time audit:

- Color contrast failures on secondary text.
- Missing alt text on images that are actually decorative (use `alt=""`, not no alt).
- `aria-label` on elements that already have visible accessible text.
- Nested interactive elements (a `<button>` inside an `<a>`).
- Empty headings.

Fix these first. They are mechanical; they do not need judgment. Axe will flag them again if they come back.

## Pass 2: keyboard only

Unplug your mouse. Literally, or at least commit to not using it.

Time budget: 45 minutes.

The protocol:

1. **Tab through the home page.** Every interactive element should receive a visible focus ring. The ring should never be invisible or cut off.
2. **Activate each interactive element with Enter or Space.** Buttons work with Space; links with Enter; both should do the right thing.
3. **Navigate to a post.** Scroll with arrow keys or Page Down. Tab through the outline. Click an outline link — focus should land inside the section.
4. **Open the theme menu (or any modal).** Tab cycles within it. Escape closes it. Focus returns to the trigger.
5. **Submit the search form.** Results render. Tab moves into the results list.

What to look for:

- **Invisible focus.** A focus state that is not visible is a blocker.
- **Focus order that jumps.** Tab should move through the document in reading order. Jumps are usually a sign of `order: -1` in Flexbox without a matching `tabindex`.
- **Interactive elements that are not focusable.** A `<div onclick>` is a keyboard dead zone. Fix by replacing with `<button>`.
- **Traps without escapes.** Any overlay that does not close with Escape is a bug.

This pass catches almost everything axe missed. The findings are usually not "my code is broken;" they are "my interaction model assumed a mouse."

## Pass 3: screen reader

Time budget: 90 minutes.

This is the uncomfortable pass. You have to turn on a screen reader and use the site for real. On macOS, that is VoiceOver. On Windows, NVDA (free) or JAWS (commercial). On iOS, VoiceOver. On Android, TalkBack.

I use VoiceOver on macOS because it is built in and most of my readers on Apple devices use it. If the site works in VO, it usually works elsewhere, because the assistive APIs are fairly consistent.

Basic VoiceOver commands:

- `Cmd+F5` — toggle VoiceOver.
- `Ctrl+Option+arrow` — move through content.
- `Ctrl+Option+U` — open the Rotor, which navigates by headings, landmarks, links, etc.
- `Ctrl+Option+Space` — activate the current element.

The audit protocol:

1. **Land on the home page with VO on.** The page title is announced. The main nav is a landmark. The article list is readable.
2. **Open the Rotor with `Ctrl+Option+U` and navigate by landmarks.** You should hear `banner`, `main`, `contentinfo`. No orphan landmarks. No missing landmarks.
3. **Navigate by headings.** The heading tree should be correct — one `h1`, descending properly. If you hear a skip ("h2 … h4"), that is a violation.
4. **Open a post.** The title is read. The date is read (or skipped if decorative). The article content is navigable.
5. **Interact with the outline.** Activating a link moves focus, and VO should announce the heading it landed on.
6. **Open the theme menu.** VO announces "dialog" on open, the first focusable element, and the title.

The findings from this pass are qualitatively different. They are about announcement correctness and context. Things you might catch:

- A date announced as a number rather than a date, because no `<time>` element was used.
- An icon button with an `aria-label` that reads awkwardly.
- A link that says "Read more" without context.
- A live region that does not announce because it was not `aria-live`.

These are the findings that automated tools cannot produce. They are also the ones that most improve the experience for actual screen reader users.

## The audit log

I keep a simple markdown log per audit. Date, scope, findings, status.

```markdown
# A11y audit — 2026-11-10

## Scope
Home, archive, a random post, search, about.

## Findings

- [x] Home: axe flagged color contrast on `.post-card__date` (3.9:1). Fixed.
- [x] Post: Tab from outline link did not move focus into the section. Added `tabindex="-1"` on headings. Fixed.
- [ ] Search: VoiceOver does not announce result count change. `aria-live="polite"` is set but on the wrong element. Open.
- [x] Archive: focus ring invisible on pagination numbers in dark mode. Bumped outline-offset. Fixed.
```

The log is a working document, not a report. I update it as I fix things. At the end of the audit, the open items are the follow-up tasks.

## The rhythm

For dout.dev, this full audit happens every quarter. Short passes (axe only) run on every CI build. The quarterly cadence catches what CI cannot: semantic issues, new content patterns, regressions that axe does not model.

## What I do not do

- **Hire a professional audit for a personal blog.** Worth it for a product. Overkill for this.
- **Run a full WCAG 2.2 AAA pass.** AAA is not a common benchmark and the incremental work is steep. AA is the target.
- **Cover every browser and screen reader combination.** VO on macOS and NVDA on Windows cover the cases I care about.

## The takeaway

Accessibility auditing on a static blog is bounded work with clear protocols. Axe + keyboard + screen reader, in an afternoon, quarterly. The findings get better over time as the codebase gets better; the first audit is always the longest.

## References

- [axe-core](https://github.com/dequelabs/axe-core)
- [WebAIM: Screen reader user survey](https://webaim.org/projects/screenreadersurvey/)
- [VoiceOver for macOS — Apple docs](https://support.apple.com/guide/voiceover/welcome/mac)
- [NVDA screen reader](https://www.nvaccess.org/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [A11y Project checklist](https://www.a11yproject.com/checklist/)
