---
title: 'WCAG 2.2 AA Without ARIA-Spam (Landmarks, Heading Order, Skip-Links - That''s 80% of It)'
date: '2026-06-02'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['accessibility', 'html', 'frontend']
series: 'How I made it'
description: 'The accessibility rules I actually apply on every page of dout.dev. Semantic HTML first, ARIA only when it earns its keep. No, you don''t need aria on everything.'
canonical_url: false
---

## The unpopular opinion (brace yourself)

*Most accessibility failures I see in production are not missing features.* They are HTML that was never semantic, covered in ARIA attributes that were supposed to fix the damage. That approach is a tax forever. ARIA is a powerful tool and also a trap: the first rule of ARIA is to NOT use it if a native element would do the job.

For dout.dev I made a rule for myself. **Every page starts as semantic HTML. ARIA only shows up when there is no native alternative.** That rule covered most of the WCAG 2.2 AA checklist before I wrote a single `aria-*` attribute.

## Landmarks: use the elements, not the roles

HTML5 already gives you landmarks. A screen reader or a "Rotor" in VoiceOver reads them as navigation regions. You do NOT need to annotate them.

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Primary">
      <!-- navigation links -->
    </nav>
  </header>
  <main id="main">
    <!-- content -->
  </main>
  <footer>
    <!-- footer content -->
  </footer>
</body>
```

`<header>`, `<main>`, `<footer>` are already landmarks. The only `role` I add is on the `<nav>` when there are multiple nav elements, and even then I use `aria-label="Primary"` to disambiguate.

## Heading order (it's not that hard)

A screen reader user navigates by headings. If your heading order goes h1 → h3 → h2, you are making blind people work harder for no reason. The rule is simple: never skip levels. h1 → h2 → h3, not h1 → h4.

Each page has exactly one `<h1>`. Sections within the page start at `<h2>`. Subsections at `<h3>`. If you need four levels of nesting in a blog post, your information architecture has bigger problems.

## Skip-links (the 5-minute win)

```html
<a class="skip-link" href="#main">Skip to content</a>
```

That is the single highest-impact accessibility fix for keyboard users. One link, visible on focus, that skips the navigation and lands the user in the main content. It takes five minutes to add and saves every keyboard user from tabbing through 47 navigation links.

## The takeaway

WCAG 2.2 AA is not a checklist of ARIA attributes you need to add. It is a checklist of semantic HTML patterns you need to follow. Landmarks, heading order, skip-links - these three things cover more ground than any ARIA-based remediation.

Write good HTML first. Add ARIA only when the native element genuinely does not cover the case. That is the entire accessibility strategy for dout.dev, and it works.
