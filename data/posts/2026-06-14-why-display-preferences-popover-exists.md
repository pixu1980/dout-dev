---
title: 'Why DisplayPreferencesPopover Exists: Accessibility Starts With User Preferences'
date: '2026-06-14'
published: true
tags: ['accessibility', 'a11y', 'frontend', 'responsive-design']
description: 'Why dout.dev ships DisplayPreferencesPopover: responsive design is accessibility, and real accessibility respects user settings for motion, contrast, transparency, typography, and layout.'
canonical_url: false
---

## Accessibility is not one feature

Most teams treat accessibility as a checklist at the end of a sprint. That approach misses the real problem. Accessibility is the baseline behavior of the interface under real user constraints.

Those constraints are not abstract. They are concrete:

- small screens and zoomed layouts;
- reduced motion preferences;
- higher contrast needs;
- transparent surfaces that lower readability;
- font sizes and font families that make text easier to parse.

**If the UI ignores those settings, it is not accessible**, even when every button has a good label.

## Responsive design is accessibility

"Responsive" does not only mean breakpoints. It means the interface keeps working when conditions change. User preferences are one of those conditions.

A responsive interface should respond to:

1. viewport changes;
2. input mode changes;
3. user readability and comfort settings.

`DisplayPreferencesPopover` exists to make that third point explicit and immediate.

## Why this component exists on dout.dev

On dout.dev, I wanted preference controls to be:

- local and persistent;
- available from every page;
- lightweight and framework-free;
- aligned with semantic HTML and progressive enhancement.

The popover stores choices in `localStorage`, applies them on the root element, and keeps the page readable without a navigation detour.

```html
<display-preferences-popover></display-preferences-popover>
```

That single element exposes controls for motion, transparency, contrast, typography, and corner radius. The page reacts through CSS tokens and root data attributes, not through per-component hacks.

## What it controls, and why

### Motion and transparency

People with vestibular sensitivity, attention fatigue, or migraine triggers can be affected by excessive animation and blur. The component lets users reduce those effects directly.

### Contrast

Theme palettes can look "clean" and still fail readability in real conditions. A direct contrast preference gives users an immediate correction path.

### Typography

Not everyone reads best with the same typeface and scale. Heading, body, and code stacks are adjustable because legibility is personal.

### Shape and visual density

Corner radius is not only visual style. It affects edge detection and separation of interactive surfaces. Offering presets helps users pick what they parse faster.

## The contract: user choice wins

The point is not to provide infinite personalization. The point is to respect explicit user intent.

When a preference is set, the interface should obey it consistently:

- no hidden overrides;
- no animation sneaking back in;
- no reset after navigation;
- no contrast drop in one section while another section is compliant.

That is why the component writes stable state and the page consumes that state from shared tokens.

## Final point

Accessibility starts before ARIA, before audits, and before tooling. It starts when the layout, motion, and text system respond to the person using the page.

`DisplayPreferencesPopover` exists to make that principle operational on every visit.

## References

- [Web Content Accessibility Guidelines (WCAG) Overview - W3C](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Understanding Success Criterion 1.4.4 Resize text - W3C](https://www.w3.org/WAI/WCAG22/Understanding/resize-text)
- [prefers-reduced-motion - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [prefers-contrast - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)
- [color-scheme - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
