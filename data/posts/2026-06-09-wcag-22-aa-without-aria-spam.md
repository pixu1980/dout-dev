---
title: 'WCAG 2.2 AA Without ARIA-Spam: Landmarks, Heading Order, Skip-Links'
date: '2026-06-09'
published: false
tags: ['accessibility', 'a11y', 'html', 'frontend']
description: 'The accessibility rules I actually apply on every page of dout.dev. Semantic HTML first, ARIA only when it earns its keep.'
canonical_url: false
---

## The unpopular opinion

Most accessibility failures I see in production are not missing features. They are HTML that was never semantic, covered in ARIA attributes that were supposed to fix the damage. That approach is a tax forever. ARIA is a powerful tool and also a trap: the first rule of ARIA is to not use it if a native element would do the job.

For dout.dev I made a rule for myself. **Every page starts as semantic HTML. ARIA only shows up when there is no native alternative.** That rule covered most of the WCAG 2.2 AA checklist before I wrote a single `aria-*` attribute.

## Landmarks: use the elements, not the roles

HTML5 already gives you landmarks. A screen reader or a "Rotor" in VoiceOver reads them as navigation regions. You do not need to annotate them.

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header>
    <nav aria-label="Primary">
      <a href="/">dout.dev</a>
      <ul>
        <li><a href="/archive.html">Archive</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <article>
      <h1>Post title</h1>
      <p>…</p>
    </article>
  </main>

  <footer>
    <p>© 2026 dout.dev</p>
  </footer>
</body>
```

No `role="banner"`, no `role="main"`, no `role="navigation"`. Each element announces itself. The only ARIA attribute here is `aria-label="Primary"` on the nav, because the page has more than one nav element and screen reader users benefit from knowing which is which.

## Heading order is a real check, not a nicety

Heading order is one of the WCAG 2.2 success criteria most sites fail silently. The rule: each page has one `h1`, and subsequent headings go down the tree in order — `h2`, then `h3`, never skipping.

On dout.dev, the post layout enforces it. The post title is always `h1`. Section headings in the markdown body start at `h2`. The post generator validates the tree at build time; if a post starts with `###`, the build fails.

```markdown
<!-- Good -->
# Post title
## Section
### Subsection
## Another section

<!-- Bad, the build rejects this -->
# Post title
#### Oops
```

## The skip-link nobody sees, but everyone benefits from

Keyboard users who arrive on a page need a way to jump to the main content without tabbing through the entire header. The skip-link is hidden visually until it receives focus, at which point it appears and announces itself.

```css
.skip-link {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  transform: translateY(-100%);
  transition: transform 0.15s;
}

.skip-link:focus-visible {
  transform: translateY(0);
}
```

The first keyboard tap on the page reveals it. Screen reader users hear it immediately regardless of visibility.

## Focus styles that show up, on purpose

Browsers removed default focus styles from buttons in some contexts and left designers to reinvent them. The result is sites where keyboard users cannot see where they are. The WCAG 2.2 addition `2.4.11 Focus Not Obscured` codifies how visible focus must be.

```css
:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-1);
}
```

`:focus-visible` shows the ring only for keyboard navigation, not for mouse clicks. That keeps the design calm for pointer users and explicit for keyboard users.

## Color contrast as a token, not an afterthought

Contrast is mathematical. You either meet the ratio or you do not. WCAG 2.2 AA requires 4.5:1 for body text, 3:1 for large text. I check every token pair against the requirement when the theme is defined, and I do not ship colors that fail.

A cheap way to keep yourself honest is to wire a contrast check into the build, so the CI fails if a semantic token combination drops below threshold. That is mechanical, not creative, and it pays back every time a designer-in-you wants to pick a "softer" foreground color.

## When ARIA does earn its keep

ARIA is not evil. It shines when native HTML genuinely does not cover what you are building:

- `aria-live="polite"` on the search results summary, so that changes in result count are announced without stealing focus;
- `aria-current="page"` on the current pagination link;
- `aria-expanded` on a disclosure button that toggles a panel;
- `aria-describedby` to associate an error message with the input it describes.

All of these are cases where a sighted user has a visual cue that non-sighted users would miss. ARIA fills the gap.

## What I refused to add

- `aria-label` on an icon that already has accessible text nearby.
- `role="button"` on a `<button>`.
- `aria-hidden="true"` on decorative icons that were inside a labeled parent — `<span aria-hidden="true">` on a pure SVG icon is fine; on a structural element it is a bug.

ARIA without a reason is noise for screen readers and maintenance for you.

## The takeaway

WCAG 2.2 AA is not a ceiling. It is a baseline, and most of it is achievable with semantic HTML, visible focus, proper heading order, and a skip-link. Start there. Add ARIA last, with intent.

## References

- [WCAG 2.2 at a Glance — W3C](https://www.w3.org/WAI/standards-guidelines/wcag/glance/)
- [Understanding WCAG 2.2 — W3C](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Using ARIA — W3C](https://www.w3.org/TR/using-aria/)
- [`:focus-visible` — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
