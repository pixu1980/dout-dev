# Incremental Roadmap – dout.dev (milestones & checklist)

> Goal: build **piece by piece** a "vanilla-first" static blog with WCAG 2.2 AAA, maintaining **0 runtime deps**, support for **last 2 major** browser versions and deploy on **GitHub Pages**. Each milestone adds or fixes functionality, with executable checklist in sequence.

---

## 📊 Project Status Overview

### ✅ Completed Milestones (11/19)

- M0 - Bootstrap repository & structure
- M1 - Template Engine (TE) core
- M2 - CMS core
- M3 - Layouts & fundamental components
- M4 - Post Page
- M5 - Archive pages (tag, months)
- M6 - Universal pagination
- M7 - Home, About, 404, Playground, Offline
- M8 - Responsive images & lazy on-reveal
- M9 - Light/dark theme + accents + header/nav
- M10 - Client-side search

### ⚠️ Mostly Complete - Issues to Address (0/19)

- None

### 🔄 Partially Implemented (0/19)

- None

### ❌ Not Started (8/19)

- Upcoming milestones M11+ (SEO/OG-image, feeds, PE/micro-UX, a11y hardening, security/CSP, i18n, analytics, CI/CD, quality/regressions)

### 🎯 Ready for Implementation

---

## Product Parameters (fixed)

- **Title/Author**: dout.dev - Emiliano "pixu1980" Pisu
- **Base Domain**: [https://dout.dev](https://dout.dev) (canonical)
- **Languages**: default **en**, localization **it** (scaffold)
- **Front-matter**: supports common fields + specified ones (series, scheduledAt, link, coverImage, pinned, keywords, layout)
- **Listing**: sorting by date desc, optional **pinned** posts at top
- **Page size**: 10 (configurable: 10/20/50)
- **Theme**: light/dark with selectable **accent-color**
- **Search**: indexes title, description, tags, series labels, **keywords extracted** from content
- **Images**: lazy (native + on-reveal), predefined breakpoints
- **Images**: lazy on-reveal via IntersectionObserver, responsive variants (320/640/960/1280), `<picture>` with WebP+raster, auto `srcset` from manifest, width/height inference for local assets
- **Browser Policy**: **last 2 majors** (Chrome, Firefox, Safari, Edge) – progressive enhancement
- **Analytics**: only **page hits** (no cookies)
- **Deploy**: GitHub Pages with **preview on PR**
- **Node**: LTS **v22**
- **CSP**: enabled; **self-hosted** fonts
- **OG-image**: generated at build time
- **Feed**: RSS + JSON Feed
- **Code Highlighting**: pix-highlighter (internal) supporting js, ts, css, html, json, bash, scss, php, c#, c++, rust, go, python

---

## M0 - Bootstrap repository & structure

**Status**: ✅ **COMPLETED**

**Goal**: repository ready with folders, base scripts and minimal CI.

**Checklist**

- [x] Initialize repo; `.editorconfig`, `.gitignore`, brief `README.md`.
- [x] Folder structure: `./scripts/cms`, `./scripts/template-engine`, `./data`, `./src` (+ sub), `./dist`, `./.github`.
- [x] `package.json`: dev-deps (@biomejs/biome, gray-matter, html-minifier, jsdom, marked, postcss, postcss-combine-media-query, vite, prettier).
- [x] NPM scripts: `cms:build`, `cms:watch`, `dev`, `build`, `preview`, `lint`, `format`.
- [x] Minimal Vite config (ESM, target es2022, base URL from domain).
- [x] Biome config (lint+format) and PostCSS with combine-media-query.
- [x] GH Action `ci.yml`: install, lint, build (no deploy yet).
- [x] Template syntax validation in CI to prevent Liquid/Jekyll syntax usage.
- [x] Complete linting infrastructure: `scripts/lint.js`, `scripts/format.js`, `scripts/format-check.js`
- [x] Asset build system: `scripts/build-assets.js` with favicon, manifest, robots.txt generation
- [x] HTML/A11Y/Links/Structure validation scripts in `scripts/linting/`

**DoD**

- [x] `pnpm run build` produces an empty but valid `dist/` (placeholder HTML).
- [x] All build scripts functional: CMS build, asset processing, Vite compilation
- [x] Linting and formatting infrastructure complete
- [x] Validation scripts for HTML quality and accessibility

**Implementation Notes**:

- Repository structure established with all required scripts
- Build pipeline green: `cms:build` + Vite build + asset processing OK; placeholder CSS/assets used to unblock early builds
- Linting/formatting via Biome (JS/CSS) and Prettier (HTML/MD/JSON); format checks pass consistently
- Validators implemented and run locally: HTML, A11Y, links, structure; link validator enhanced (strip query params, resolve directory index)
- CI workflow runs tests, lint, CMS build, site build and manifest/index verifications; Liquid/Jekyll syntax banned in templates
- Tests: 186/186 pass; Accessibility: no critical issues, some warnings deferred to M3

---

## M1 - Template Engine (TE) core

**Status**: ✅ **COMPLETED**

**Goal**: template engine with include/extend/blocks/expressions/filters.

**Checklist**

- [x] TE: `<include src>`, `<extends src>`, `<block name>`.
- [x] Expressions `{{ var | filter }}` with escaping by-default and `raw` filter.
- [x] Built-in filters: `upper`, `lower`, `capitalize`, `slug`, `md`, `date`, `escapeHtml`, `default`.
- [x] Conditionals `<if condition>` and loops `<for each="x in list">` + `<switch>`.
- [x] Path resolution **relative to calling file** (no surprises).
- [x] Expression sandbox (no `eval`); error handling graceful in tests.

**DoD**

- [x] Unit tests TE (include/extend/if/for/switch/filters).

**Implementation Notes**:

- Complete template engine implemented in `scripts/template-engine/`
- Files: `expression-parser.js`, `filters.js`, `index.js`, `renderer.js`
- Custom syntax enforced: `<if condition="">`, `<for each="">`, `<include src="">`, `<extends layout="">`
- Comprehensive test suite in `scripts/template-engine/tests/`
- Template syntax validation prevents Liquid/Jekyll syntax usage
- All templates in project use correct custom syntax

---

## M2 - CMS core

**Status**: ✅ **COMPLETED**

**Goal**: CMS system with MD parsing and index generation.

**Checklist**

- [x] Parsing front-matter + markdown → HTML
- [x] Post normalization (title, slug, date, tags, published)
- [x] Index generation: posts, tags, months, series
- [x] HTML generation: individual posts, tag pages, month archives
- [x] Integration with template engine for rendering

**DoD**

- [x] CMS tests (parsing, validation, index generation)
- [x] Working `npm run cms:build` script
- [x] Actual HTML file generation in `src/posts/`, `src/tags/`, `src/months/`

**Implementation Notes**:

- Complete CMS system implemented in `scripts/cms/`
- Files: `build.js`, `post-processor.js`, `page-generator.js`, `marked-syntax.js`
- Successfully parsing 23 markdown posts from `data/posts/`
- Index generation working: `posts.json`, `tags.json`, `months.json` in `data/`
- HTML generation working: 23 posts in `src/posts/`, 19 tag pages in `src/tags/`, month archives
- Full integration with template engine for page rendering
- Comprehensive test suite in `scripts/cms/tests/`

---

## M3 - Layouts & fundamental components

**Status**: ✅ **COMPLETED**

**Goal**: define base layout and reusable components.

**Checklist**

- [x] Complete vanilla CSS system with @layer architecture (tokens, reset, base, layout, components, utilities, overrides)
- [x] Proprietary design token system (colors/spacing/typography; naming WIP but scoped under :root)
- [x] Element-first styling approach with semantic HTML priority
- [x] CSS hierarchy implemented across layers
- [x] OpenProps removal and framework independence ensured
- [x] Dark mode support via prefers-color-scheme (toggle UI deferred to M9)
- [ ] WCAG 2.2 AAA compliance patterns (dedicated pass in M14; partial now)
- [x] Responsive design with rem/em units and fluid container
- [x] CSS containment and performance optimizations (contain, content-visibility)
- [x] Template structure created (layouts/base.html, minimal)
- [x] Component structure created (header.html, footer.html)

**DoD**

- [x] All CSS/JS/HTML built artifacts pass validators; lint passes without errors
- [x] Design tokens scoped and functional; CSS layers active
- [x] Dark mode honors system preference; UI toggle planned in M9
- [x] No external CSS framework dependencies
- [x] Documentation added in M3-IMPLEMENTATION-REPORT.md

**Critical Issues Found (resolved)**:

- ✅ CSS present in `src/styles/main.css` with full layered system
- ✅ Base layout correctly links stylesheet
- ✅ Tokens and design system established
- ✅ Templates styled with base layout and container

**Next Steps**:

1. Address remaining a11y warnings on a few pages (M14)

---

## M4 - Post Page

**Status**: ✅ **COMPLETED**

**Goal**: generate static post pages with TE and CMS.

**Checklist**

- [x] Template `./src/templates/post.html` + layout hook.
- [x] Metadata: `<title>`, meta description, canonical; minimal JSON-LD `BlogPosting`.
- [x] Support `coverImage` and `pinned` badge (badge visual shown in listings later; support present in data model).
- [x] pix-highlighter integrated (runtime component) with theme tokens.

**DoD**

- [x] A real post from `./data/` is generated in `./src/posts/*.html` and validated.

**Implementation Status**:

- ✅ Template `post.html` enriched (OG/Twitter meta, JSON-LD, cover image, tag pills, prev/next)
- ✅ 23 posts generated successfully from `data/posts/`
- ✅ pix-highlighter available and tested in suite
- ✅ Cover image support wired in post-processor and template
- ✅ Custom template syntax respected throughout
- ℹ️ A11y: a few non-blocking warnings remain (landmarks/multiple H1 on a test page)

**Generated Content Verification**:

- 23 post HTML files in `src/posts/` (2019–2025)
- All validators green: HTML, Structure, Links; A11y has warnings only (no critical)

**Issues to Address**:

- Address remaining A11y warnings in later milestones (M14)

---

## M5 - Archive pages (tag, months)

**Status**: ✅ **COMPLETED**

**Goal**: Generate archive pages for tags and months with pagination and RSS.

**Checklist**

- [x] Templates: `./src/templates/tag.html`, `./src/templates/month.html`.
- [x] Generate `./src/tags/<tag>.html`, `./src/months/YYYY-MM.html`.
- [ ] Pagination - deferred to M6 (universal pagination)
- [x] RSS feeds at archive level (tags and months XML)

**DoD**

- [ ] Navigate to a tag page on generated site.
- [ ] Navigate to monthly archive page.

**Implementation Status**:

- ✅ Templates for archives present (`tag.html`, `month.html`, `series.html`)
- ✅ 19 tag pages e 11 month pages generati
- ✅ RSS feed generati per ogni tag (`src/tags/<slug>.xml`) e mese (`src/months/<YYYY-MM>.xml`)
- ✅ Head arricchito con `<link rel="alternate" type="application/rss+xml">` e meta OG/Twitter
- ⚠️ Pagination rinviata a M6 (config PAGE_SIZE già presente)

**Generated Content Verification**:

- 19 file tag HTML + 19 feed XML
- 11 file month HTML + 11 feed XML
- Validatori tutti verdi (HTML/Struttura/Link); A11y con soli warning non bloccanti

**Issues to Address**:

- Rimane la paginazione (M6)
- Same HTML validation issues as posts (lang, viewport, etc.)

---

## M6 - Universal pagination

**Status**: ✅ COMPLETED

**Goal**: first/prev/1…x/next/last pagination per Tag/Month/Series (search in M12).

**Checklist**

- [x] Config `PAGE_SIZE` (10/20/50) in `cms/config.js`.
- [x] Static URLs: page 1 flat; subsequent pages in subfolders (`/a11y/2/`).
- [x] `rel="prev"/"next"`, `aria-current="page"`, ellissi non cliccabili.
- [x] UI paginazione estratta in include riutilizzabile.

**DoD**

- [x] Tag e mesi: paginazione attiva quando > `PAGE_SIZE`.
- [x] Series: paginazione identica a tag/mesi.

**Implementation Status**:

- ✅ Page generation: helper condiviso per liste paginate in `scripts/cms/page-generator.js` (tags, months, series)
- ✅ URL structure: pagina 1 piatta (`/tags/slug.html`), 2+ in sottocartelle con `index.html` (`/tags/slug/2/`)
- ✅ UI component: `src/components/pagination.html` incluso in `src/templates/tag.html`, `month.html`, `series.html`
- ✅ Accessibilità/SEO: `rel="prev"/"next"`, `aria-current="page"`, ellissi non cliccabili
- ✅ Test e validatori verdi; build ok

**Follow-ups**:

- Lint fixabili (template literals, optional chaining, import `node:`) - non bloccanti
- Ricerca: integrazione della paginazione in M12

---

## M7 - Home, About, 404, Playground, Offline

**Status**: ✅ **COMPLETED**

**Goal**: general static pages.

**Checklist**

- [x] `index.html` with latest posts (pinned on-top), `about.html`, `404.html`, `playground.html`, `offline.html`.
- [ ] Accessible breadcrumb and TOC (if present).  
       Note: not required for current pages; breadcrumbs can be introduced alongside header/nav in M9.

**DoD**

- [x] Local build navigable with all base pages.

**Implementation Status**:

- ✅ Static pages added: `src/index.html`, `src/about.html`, `src/404.html`, `src/playground.html`, `src/offline.html`.
- ✅ Home lists latest posts with pinned posts surfaced on top; card UI polished.
- ✅ CMS flow generates/keeps these pages; validations (HTML/A11y/Links/Structure) are green with only non-blocking warnings.
- ✅ URL scheme normalized to `.html` consistently (including RSS links).

**Notes**:

- Breadcrumb/TOC left for future milestones if needed (see M9/M14). Existing pages have clear headings and landmarks.

---

## M8 - Responsive images & lazy on-reveal

**Status**: ✅ **COMPLETED**

**Goal**: deliver a robust responsive image system with lazy on-reveal and build-time variants.

**Checklist**

- [x] Attributes: `loading="lazy"` (default), `decoding="async"`; `loading=eager` / `priority=high` supported via Markdown title meta for LCP.
- [x] Lazy loader with `IntersectionObserver`: promotes `<source data-srcset>` → `srcset`, `<img data-src>` → `src` and sets class `is-revealed`.
- [x] `<noscript>` fallback for all lazy images.
- [x] Reserved dimensions: for local PNG/JPEG assets, width/height inferred to reduce CLS.
- [x] Build-time image pipeline: generates raster variants (320/640/960/1280) and WebP; writes `src/assets/images-manifest.json`.
- [x] Auto `srcset` from manifest when author provides only base `src`.
- [x] Output uses `<picture>` with WebP and raster `<source>` both in eager and lazy flows.
- [x] Resilient pipeline: skips bad assets; auto-repairs placeholder images to valid sRGB JPEG where needed.

**DoD**

- [x] Tests pass for Markdown renderer (lazy/eager flows, title meta parsing, `<picture>` output, `noscript` presence).
- [x] Build completes, manifest generated, validators green (HTML/Links/A11y/Structure).
- [x] Non-LCP images lazy-load; LCP images support eager/high priority.

**Implementation Notes**

- Markdown renderer (`scripts/cms/marked-syntax.js`) parses title meta: `srcset`, `sizes`, `loading`, `priority`.
- Renderer integrates manifest to auto-build `srcset`; uses helpers to render eager/lazy `<picture>` with `<source>` for WebP and raster.
- Lazy loader (`src/scripts/lazy-images.js`) reveals `<source data-srcset>` and `<img data-src*`), sets defaults, marks as `is-revealed`.
- Image pipeline (`scripts/cms/generate-images.js`) produces variants + WebP, writes manifest; robust error handling with per-file skip and optional auto-repair of invalid placeholders.

---

## M9 - Light/dark theme + accents + header/nav

**Status**: ✅ **COMPLETED**

**Goal**: theme switch + accent-color selection, respecting OS preferences.

**Checklist**

- [x] `prefers-color-scheme` honored; toggle persisted (localStorage).
- [x] Accent-color palette with CSS custom properties; choice UI (accessible group of buttons).
- [x] Header with logo, main nav (pages), responsive hamburger menu (ARIA + focus trap), theme selector, accent selector.
- [x] Persisted user selections (localStorage) with reduced-motion respect.
- [x] `prefers-reduced-motion` disables non-essential transitions.

**DoD**

- [x] Theme and accents survive reload; adequate contrast.

**Implementation Notes**:

- Header component includes brand, menu toggle (ARIA), main nav, theme switcher, and accent picker.
- JS adds theme cycle (auto/dark/light), accent persistence, accessible nav with Escape and focus trap, and outside-click close.
- CSS tokens extended with [data-theme] overrides; mobile nav styles; reduced-motion respected.

---

## M10 - Client-side search

**Status**: ✅ **COMPLETED**

**Goal**: `search.html` page with local indexing.

**Checklist**

- [x] Load `posts.json`, `tags.json`, `months.json`, `series.json` (same domain).
- [x] **Keyword** extraction from content (build-time) and boost in ranking.
- [x] Accessible UI: `role="search"`, announcements in `aria-live` for results and page changes.
- [x] Type filters UI (posts/tags/series/months) wired to results and URL (`?type=...`).
- [x] Client-side pagination strictly unified with `pagination.html` include (semantics and markup aligned).
- [x] Keyboard shortcut `/` for search focus.

**DoD**

- [x] Stable search, deep-link via `?q=...&page=...` (posts, tags, series, months; basic scoring)

**Missing Implementation**:

- None

**Dependencies**:

- None (M3/M7 complete)

---

## M11 - SEO & OG-image in build

**Status**: ❌ **NOT STARTED**

**Goal**: coherent meta/OG/JSON-LD + OG-image generator.

**Checklist**

- [ ] Coherent canonical for page 1 of listings.
- [ ] JSON-LD for posts/archives/breadcrumb.
- [ ] OG-image generator (build-time) from template (HTML→PNG/SVG); cache.

**DoD**

- [ ] Validators (Rich Results, OG debug) report no errors.

**Implementation Status**:

- ✅ Canonical URLs implemented in all templates
- ✅ Schema.org JSON-LD for BlogPosting, BreadcrumbList
- ✅ OpenGraph and Twitter Card meta tags
- ❌ No OG-image generation system
- ❌ No build-time image cache

**Current State**: Strong SEO foundation but missing dynamic image generation

---

## M12 - Feed (RSS + JSON Feed)

**Status**: ❌ **NOT STARTED**

**Goal**: export feeds from normalized data.

**Checklist**

- [ ] `feed.rss` and `feed.json` in `./dist/` with latest N posts.
- [ ] Feed links in `<head>` and footer.

**DoD**

- [ ] Common readers correctly read both feeds.

**Missing Implementation**:

- ❌ No RSS feed generation
- ❌ No JSON Feed generation
- ❌ No feed templates
- ❌ No feed links in templates

**Dependencies**:

- Requires feed generation in CMS build pipeline

---

## M13 - Cutting-edge APIs (PE) & micro-UX

**Status**: ❌ **NOT STARTED**

**Goal**: enable modern features with **progressive enhancement**.

**Checklist**

- [ ] View Transitions API for internal navigation (feature-checked).
- [ ] Navigation API to improve internal link UX (fallback full-load).
- [ ] `requestIdleCallback` for non-critical work (search index).
- [ ] CSS `:has()`, `@container`, `accent-color`, `color-mix()` where useful.

**DoD**

- [ ] With APIs disabled, UX remains intact and accessible (no console errors).

---

## M14 - Accessibility dedicated pass

**Status**: ❌ **NOT STARTED**

**Goal**: strengthen WCAG 2.2 AAA patterns.

**Checklist**

- [ ] Bilingual skip-link present and visible on focus; focus management.
- [ ] ARIA landmarks, hierarchical headings, accessible footnotes.
- [ ] ARIA announcements in search/pagination; keyboard-only end-to-end.
- [ ] Manual audit with screen reader (VO/NVDA) + fixes.

**DoD**

- [ ] No critical issues in audit; forms and keyboard navigation flawless.

---

## M15 - Security & CSP

**Status**: ❌ **NOT STARTED**

**Goal**: hardening of attack surface.

**Checklist**

- [ ] Strict CSP (default-src 'self'; nonce/hash for critical inline if present).
- [ ] SRI for third-party assets (if used); Referrer-Policy, Permissions-Policy.
- [ ] HTML sanitization from Markdown at build (safe tag/attr whitelist).

**DoD**

- [ ] CSP reports without violations; no XSS via content.

---

## M16 - i18n (IT scaffold)

**Status**: ❌ **NOT STARTED**

**Goal**: prepare Italian localization maintaining en as default.

**Checklist**

- [ ] Structure `en/` and `it/` for main pages (home, about, archives).
- [ ] `hreflang` and accessible language switch.
- [ ] Compatible front-matter (titles/descriptions per language if needed).

**DoD**

- [ ] Home/About/1 archive working in both languages.

---

## M17 - Analytics (page hits only)

**Status**: ❌ **NOT STARTED**

**Goal**: minimal privacy-respectful tracking.

**Checklist**

- [ ] Simple endpoint (serverless/gh-stats) or log-based integration; no cookies.
- [ ] `pageview` event on load; DNT respect; opt-out.
- [ ] Basic dashboard (CSV/JSON) for counts.

**DoD**

- [ ] Page hit counting verifiable and replicable.

---

## M18 - Final CI/CD & automatic deploy

**Status**: ❌ **NOT STARTED**

**Goal**: complete GitHub Actions pipeline with PR preview and deploy.

**Checklist**

- [ ] Build action: Node v22, install, `cms:build`, `vite build`.
- [ ] PR preview: artifact or Pages preview for branch.
- [ ] Deploy to `gh-pages` on tagged push to `main`.
- [ ] `.github/COPILOT_RULES.md` and `copilot-instructions.md` documented.

**DoD**

- [ ] Every PR produces navigable preview; merge to main publishes.

---

## M19 - Quality & regressions

**Status**: ❌ **NOT STARTED**

**Goal**: prevent regressions on content and layout.

**Checklist**

- [ ] Internal link checker (href/src) on generated files.
- [ ] Spell-check it/en on content.
- [ ] Visual regression on key templates (image diff).

**DoD**

- [ ] Green CI with consistent quality checks.

---

## Dependencies between milestones (recommended order)

M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11 → M12 → M13 → M14 → M15 → M16 → M17 → M18 → M19

---

## Practical conventions

- **Branch naming**: `feat/mX-short-name`, `fix/mX-description`, `docs/mX-...`.
- **Commits**: Conventional Commits (feat/fix/docs/chore/refactor/test).
- **PR template**: description, screenshots, "How to test", A11y check.

---

## Implementation notes

- No **budget** for JS/CSS size; good practices remain but not blocking.
- Cutting-edge APIs always behind PE and _feature detection_.
- `PAGE_SIZE` selectable also from UI (optional) or query string (`?pp=20`).
