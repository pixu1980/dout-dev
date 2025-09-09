# M3 — Implementation Report (COMPLETED)

This report summarizes what was implemented for M3 (Layouts & fundamental components), key decisions, and follow‑ups. Status: COMPLETED (2025‑09‑07).

## Summary

- Introduced a layered CSS architecture in `src/styles/main.css`:
  - `@layer tokens, reset, base, layout, components, utilities, overrides`
- Defined design tokens (colors, spacing, typography) with dark theme via `prefers-color-scheme`.
- Adopted element-first, semantic HTML approach. Removed `!important` usages.
- Wired base layout (`src/layouts/base.html`) and wrapped header/footer in `.container`.
- Added components styling for skip link, tag pills, cards, and utilities like `.visually-hidden`.
- Added Home posts grid (`.posts-grid`) and `.post-card` component with CSS containment and content‑visibility for perf.

## Rationale & conventions

- Vanilla-first: no runtime CSS/JS frameworks. Keep footprint minimal and maintainable.
- Tokens live under `:root` and are overridden in `@media (prefers-color-scheme: dark)`.
- Layers order enforces cascade discipline: tokens → reset → base → layout → components → utilities → overrides.
- Units: rem/em and fluid sizing for responsiveness.
- Accessibility: semantic landmarks, visible skip link, high contrast by default.

## Quality gates

- Build: CMS generates posts/tags/months/series successfully.
- Validators: HTML, Links, Structure — all green.
- Accessibility: no critical issues; 6 warnings left on a few pages.
- Lint: no errors (Biome) after fixes; warnings tracked for future refactors.
- Tests: 189/189 passing.

## Next steps

- Add short, focused docs for tokens and usage examples in templates.
- Apply `content-visibility`/`contain` selectively (done for listing/card components; extend if beneficial).
- Introduce theme toggle and accent system in M9.
- Address minor A11y warnings (landmarks on demo/404/privacy; single H1 on example post).
