# Incremental Roadmap – dout.dev (milestones & checklist)

> Goal: build **piece by piece** a "vanilla-first" static blog with WCAG 2.2 AAA, maintaining **0 runtime deps**, support for **last 2 major** browser versions and deploy on **GitHub Pages**. Each milestone adds or fixes functionality, with executable checklist in sequence.

---

## Product Parameters (fixed)

* **Title/Author**: dout.dev — Emiliano "pixu1980" Pisu
* **Base Domain**: [https://dout.dev](https://dout.dev) (canonical)
* **Languages**: default **en**, localization **it** (scaffold)
* **Front-matter**: supports common fields + specified ones (series, scheduledAt, link, coverImage, pinned, keywords, layout)
* **Listing**: sorting by date desc, optional **pinned** posts at top
* **Page size**: 10 (configurable: 10/20/50)
* **Theme**: light/dark with selectable **accent-color**
* **Search**: indexes title, description, tags, series labels, **keywords extracted** from content
* **Images**: lazy (native + on-reveal), predefined breakpoints
* **Browser Policy**: **last 2 majors** (Chrome, Firefox, Safari, Edge) – progressive enhancement
* **Analytics**: only **page hits** (no cookies)
* **Deploy**: GitHub Pages with **preview on PR**
* **Node**: LTS **v22**
* **CSP**: enabled; **self-hosted** fonts
* **OG-image**: generated at build time
* **Feed**: RSS + JSON Feed
* **Code Highlighting**: pix-highlighter (internal) supporting js, ts, css, html, json, bash, scss, php, c#, c++, rust, go, python

---

## M0 — Bootstrap repository & structure

**Goal**: repository ready with folders, base scripts and minimal CI.

**Checklist**

* [ ] Initialize repo; `.editorconfig`, `.gitignore`, brief `README.md`.
* [ ] Folder structure: `./scripts/cms`, `./scripts/template-engine`, `./data`, `./src` (+ sub), `./dist`, `./.github`.
* [ ] `package.json`: dev-deps (@biomejs/biome, gray-matter, html-minifier, jsdom, marked, postcss, postcss-combine-media-query, vite).
* [ ] NPM scripts: `cms:build`, `cms:watch`, `dev`, `build`, `preview`, `lint`, `format`.
* [ ] Minimal Vite config (ESM, target es2022, base URL from domain).
* [ ] Biome config (lint+format) and PostCSS with combine-media-query.
* [ ] GH Action `ci.yml`: install, lint, build (no deploy yet).

**DoD**

* [ ] `pnpm run build` produces an empty but valid `dist/` (placeholder HTML).

---

## M1 — Template Engine (TE) core

**Goal**: template engine with include/extend/blocks/expressions/filters.

**Checklist**

* [ ] TE: `<include src>`, `<extends src>`, `<block name>`.
* [ ] Expressions `{{ var | filter }}` with escaping by-default and `raw` filter.
* [ ] Built-in filters: `upper`, `lower`, `capitalize`, `slug`, `md`, `date`, `escapeHtml`, `default`.
* [ ] Conditionals `<if condition>` and loops `<for each="x in list">` + `<switch>`.
* [ ] Path resolution **relative to calling file** (no surprises).
* [ ] Expression sandbox (no `eval`), errors with line/column position.

**DoD**

* [ ] Unit tests TE (include/extend/if/for/switch/filters).

---

## M2 — CMS core

**Goal**: CMS system with MD parsing and index generation.

**Checklist**

* [ ] Parsing front-matter + markdown → HTML
* [ ] Post normalization (title, slug, date, tags, published)  
* [ ] Index generation: posts, tags, months, series 
* [ ] HTML generation: individual posts, tag pages, month archives
* [ ] Integration with template engine for rendering

**DoD**

* [ ] CMS tests (parsing, validation, index generation)
* [ ] Working `npm run cms:build` script
* [ ] Actual HTML file generation in `src/posts/`, `src/tags/`, `src/months/`

---

## M3 — Layouts & fundamental components

**Goal**: define base layout and reusable components.

**Status**: ✅ **COMPLETED** (15 agosto 2025)

**Checklist**

* [ ] Complete vanilla CSS system with @layer architecture
* [ ] Proprietary design token system (`--target--variation--state--property` naming)
* [ ] Element-first styling approach with semantic HTML priority
* [ ] CSS hierarchy implementation (variables → position → display → visibility → box-model → colors → typography → transforms → behavior)
* [ ] Complete OpenProps removal and framework independence
* [ ] Dark mode support with system preference detection
* [ ] WCAG 2.2 AAA compliance built-in
* [ ] Responsive design system with rem/em units
* [ ] CSS containment and performance optimizations

**DoD**

* [ ] All CSS files lint-error free
* [ ] Design tokens properly scoped and functional
* [ ] @layer architecture working correctly
* [ ] Dark mode system functioning
* [ ] Zero OpenProps or external CSS framework dependencies
* [ ] Complete documentation in M3-IMPLEMENTATION-REPORT.md

**Implementation Details**:
- Created 7-layer CSS architecture: reset, tokens, base, layout, components, utilities, overrides
- Implemented comprehensive design token system with 200+ CSS variables
- Established element-first styling methodology
- Built responsive grid and flexbox layout systems
- Created reusable component library (buttons, cards, navigation, etc.)
- Removed all external CSS dependencies achieving complete framework independence

---

## M4 — Post Page

**Status**: ✅ COMPLETED (27 Dec 2024)

**Goal**: generate static post pages with TE and CMS.

**Checklist**

* [ ] Template `./src/templates/post.html` + layout hook.
* [ ] Metadata: `<title>`, meta description, canonical; minimal JSON-LD `BlogPosting`.
* [ ] Support `coverImage` and `pinned` badge (only in listings).
* [ ] pix-highlighter integrated (runtime component) with theme tokens.

**DoD**

* [ ] A real post from `./data/` is generated in `./src/posts/*.html` and validated.

**Implementation Details**
- Template `post.html` enhanced with comprehensive Schema.org BlogPosting markup
- Support for `coverImage` with performance optimizations (`fetchpriority="high"`, `loading="eager"`)
- `pinned` badge implementation with `data-pinned` attribute for listings
- pix-highlighter integration supporting: js, ts, css, html, json, bash, scss, php, c#, c++, rust, go, python
- Enhanced meta tags: OpenGraph article type, Twitter Card, article tags
- Added `striptags` filter to template engine for Schema.org content sanitization
- Test post created and successfully generated: `2024-12-27-m4-template-test.html`

---

## M5 — Indexes and archive pages (Tags/Months/Series)

**Status**: ✅ **COMPLETED** (27 Dec 2024)

**Goal**: archive pages with listings (tags, months, series) and definitive URL structure.

**Checklist**

* [ ] Generate `./src/tags/<tag>.html`, `./src/months/YYYY-MM.html`, `./src/series/<series>.html`.
* [ ] Listings sorted by date desc, **pinned** at top.
* [ ] Card component (title, excerpt, tags, date, link).

**DoD**

* [ ] Tags, Months, Series for demo data are reachable and correct.

**Implementation Details**:
- Enhanced `index-generator.js` to include full post data in tag and month indices
- Created `sortPostsWithPinned()` function in `page-generator.js` for proper sorting (pinned first, then by date desc)
- Implemented post-card template component inline in `tag.html` and `month.html` templates
- Added comprehensive CSS styling for post cards with hover effects and pinned post indicators
- Enhanced `evaluateCondition()` in expression parser to support basic && and .length conditions
- Generated 19 tag pages and 11 month archive pages with proper navigation
- Post cards include: title with links, formatted dates in Italian, descriptions, and "read more" links
- Known limitation: Tag display within post cards requires template engine improvement for nested object access in loops

**Generated Pages**:
- Tag pages: `a11y.html`, `css.html`, `html.html`, `javascript.html`, etc. (19 total)
- Month pages: `2019-01.html` through `2025-08.html` (11 total)
- All pages include proper sorting with pinned posts at top and chronological order

---

## M6 — Universal pagination

**Goal**: **first/prev/1…x/next/last** pagination for Tags/Months + search (later).

**Checklist**

* [ ] Config `PAGE_SIZE` (10/20/50) in `cms/config.mjs`.
* [ ] Static URLs: page 1 flat; subsequent pages in subfolders (`/a11y/2/`).
* [ ] `rel="prev"/"next"`, `aria-current="page"`, non-clickable ellipses.

**DoD**

* [ ] Archives (tags, months, series) with > `PAGE_SIZE` posts correctly show pagination.

---

## M7 — Home, About, 404, Playground, Offline

**Goal**: general static pages.

**Checklist**

* [ ] `index.html` with latest posts (pinned on-top), `about.html`, `404.html`, `playground.html`, `offline.html`.
* [ ] Accessible breadcrumb and TOC (if present).

**DoD**

* [ ] Local build navigable with all base pages.

---

## M8 — Responsive images & lazy on-reveal

**Goal**: image pipeline and robust lazy loading.

**Checklist**

* [ ] Attributes: `loading="lazy"`, `decoding="async"`, `fetchpriority` for LCP.
* [ ] Script `IntersectionObserver` → swap `data-src`/`data-srcset` on reveal, class `is-revealed`.
* [ ] `noscript` fallback; reserved dimensions (no CLS).

**DoD**

* [ ] Lighthouse doesn't report CLS; non-LCP images are lazy correctly.

---

## M9 — Light/dark theme + accents + header/nav

**Goal**: theme switch + accent-color selection, respecting OS preferences.

**Checklist**

* [ ] `prefers-color-scheme` honored; toggle persisted (localStorage).
* [ ] Accent-color palette with CSS custom properties; choice UI (accessible menu / dialog).
* [ ] Header with logo, main nav (pages), responsive hamburger menu (ARIA + focus trap), theme selector, accent selector.
* [ ] Persisted user selections (localStorage) with reduced-motion respect.
* [ ] `prefers-reduced-motion` disables non-essential transitions.

**DoD**

* [ ] Theme and accents survive reload; adequate contrast.

---

## M10 — Client-side search

**Goal**: `search.html` page with local indexing.

**Checklist**

* [ ] Load `posts.json`, `tags.json`, `months.json`, `series.json` (same domain).
* [ ] **Keyword** extraction from content (build-time) for light boosting.
* [ ] Accessible UI: `role="search"`, announcements in `aria-live` for results.
* [ ] Client-side pagination shared with `pagination.html` component.
* [ ] Keyboard shortcut `/` for search focus.

**DoD**

* [ ] Stable search, deep-link via `?q=...&page=...`.

---

## M11 — SEO & OG-image in build

**Goal**: coherent meta/OG/JSON-LD + OG-image generator.

**Checklist**

* [ ] Coherent canonical for page 1 of listings.
* [ ] JSON-LD for posts/archives/breadcrumb.
* [ ] OG-image generator (build-time) from template (HTML→PNG/SVG); cache.

**DoD**

* [ ] Validators (Rich Results, OG debug) report no errors.

---

## M12 — Feed (RSS + JSON Feed)

**Goal**: export feeds from normalized data.

**Checklist**

* [ ] `feed.rss` and `feed.json` in `./dist/` with latest N posts.
* [ ] Feed links in `<head>` and footer.

**DoD**

* [ ] Common readers correctly read both feeds.

---

## M13 — Cutting-edge APIs (PE) & micro-UX

**Goal**: enable modern features with **progressive enhancement**.

**Checklist**

* [ ] View Transitions API for internal navigation (feature-checked).
* [ ] Navigation API to improve internal link UX (fallback full-load).
* [ ] `requestIdleCallback` for non-critical work (search index).
* [ ] CSS `:has()`, `@container`, `accent-color`, `color-mix()` where useful.

**DoD**

* [ ] With APIs disabled, UX remains intact and accessible (no console errors).

---

## M14 — Accessibility dedicated pass

**Goal**: strengthen WCAG 2.2 AAA patterns.

**Checklist**

* [ ] Bilingual skip-link present and visible on focus; focus management.
* [ ] ARIA landmarks, hierarchical headings, accessible footnotes.
* [ ] ARIA announcements in search/pagination; keyboard-only end-to-end.
* [ ] Manual audit with screen reader (VO/NVDA) + fixes.

**DoD**

* [ ] No critical issues in audit; forms and keyboard navigation flawless.

---

## M15 — Security & CSP

**Goal**: hardening of attack surface.

**Checklist**

* [ ] Strict CSP (default-src 'self'; nonce/hash for critical inline if present).
* [ ] SRI for third-party assets (if used); Referrer-Policy, Permissions-Policy.
* [ ] HTML sanitization from Markdown at build (safe tag/attr whitelist).

**DoD**

* [ ] CSP reports without violations; no XSS via content.

---

## M16 — i18n (IT scaffold)

**Goal**: prepare Italian localization maintaining en as default.

**Checklist**

* [ ] Structure `en/` and `it/` for main pages (home, about, archives).
* [ ] `hreflang` and accessible language switch.
* [ ] Compatible front-matter (titles/descriptions per language if needed).

**DoD**

* [ ] Home/About/1 archive working in both languages.

---

## M17 — Analytics (page hits only)

**Goal**: minimal privacy-respectful tracking.

**Checklist**

* [ ] Simple endpoint (serverless/gh-stats) or log-based integration; no cookies.
* [ ] `pageview` event on load; DNT respect; opt-out.
* [ ] Basic dashboard (CSV/JSON) for counts.

**DoD**

* [ ] Page hit counting verifiable and replicable.

---

## M18 — Final CI/CD & automatic deploy

**Goal**: complete GitHub Actions pipeline with PR preview and deploy.

**Checklist**

* [ ] Build action: Node v22, install, `cms:build`, `vite build`.
* [ ] PR preview: artifact or Pages preview for branch.
* [ ] Deploy to `gh-pages` on tagged push to `main`.
* [ ] `.github/COPILOT_RULES.md` and `copilot-instructions.md` documented.

**DoD**

* [ ] Every PR produces navigable preview; merge to main publishes.

---

## M19 — Quality & regressions

**Goal**: prevent regressions on content and layout.

**Checklist**

* [ ] Internal link checker (href/src) on generated files.
* [ ] Spell-check it/en on content.
* [ ] Visual regression on key templates (image diff).

**DoD**

* [ ] Green CI with consistent quality checks.

---

## Dependencies between milestones (recommended order)

M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11 → M12 → M13 → M14 → M15 → M16 → M17 → M18 → M19

---

## Practical conventions

* **Branch naming**: `feat/mX-short-name`, `fix/mX-description`, `docs/mX-...`.
* **Commits**: Conventional Commits (feat/fix/docs/chore/refactor/test).
* **PR template**: description, screenshots, "How to test", A11y check.

---

## Implementation notes

* No **budget** for JS/CSS size; good practices remain but not blocking.
* Cutting-edge APIs always behind PE and *feature detection*.
* `PAGE_SIZE` selectable also from UI (optional) or query string (`?pp=20`).
