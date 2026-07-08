---
title: 'Why DisplayPreferencesPopover Exists (Accessibility Is Not a Checklist, It''s User Preferences)'
date: '2026-06-09'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['accessibility', 'frontend', 'responsive-design']
series: 'How I made it'
description: 'Why dout.dev ships DisplayPreferencesPopover: responsive design is accessibility, and real accessibility respects user settings for motion, contrast, transparency, typography, and layout.'
canonical_url: false
---

## Accessibility is not one feature (it's ALL of them)

Most teams treat accessibility as a checklist at the end of a sprint. That approach misses the real problem. Accessibility is the baseline behavior of the interface under real user constraints.

Those constraints are not abstract. They are concrete:

- small screens and zoomed layouts;
- reduced motion preferences;
- higher contrast needs;
- transparent surfaces that lower readability;
- font sizes and font families that make text easier to parse.

**If the UI ignores those settings, it is not accessible**, even when every button has a good label.

## Responsive design is accessibility

The popover on dout.dev exposes settings that the browser already knows about: motion, contrast, color scheme, font size. It does not invent new ones. The settings are mapped directly to CSS custom properties that flip at the root level.

## The takeaway

Accessibility is not a feature you bolt on. It is the system's respect for user preferences. A popover that exposes those preferences is not a nice-to-have; it is the UI admitting that the browser cannot detect every user need, and giving the user control.

Design for preferences first. Add ARIA second. That order matters.
