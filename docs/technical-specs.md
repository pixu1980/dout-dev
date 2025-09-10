# Functional & Technical Specifications – Static Blog (Vanilla, WCAG 2.2 AAA)

> Purpose: define operational architecture, flows, data model and functional specifications to build a fully static, accessible, deterministic blog platform with **zero runtime dependencies**, **semantic HTML**, and **WCAG 2.2 AAA** compliance. All documentation MUST be in English (project rule).

---

## 1. Guiding Principles

- **Vanilla-first**: Pure JS / CSS (no runtime libraries); any dependency is build‑time only.
- **Custom SSG**: Static generation through an **internal CMS pipeline** + **proprietary template engine**.
- **Accessibility by design**: Semantic structure, ARIA landmarks, focus management, contrast ratios, keyboard UX.
- **Portability**: Fully static artifact deployable on any static host (e.g. GitHub Pages, generic static hosting).
- **Determinism**: Idempotent, reproducible builds (same input → same output byte for byte where timestamps absent).
- **Observability**: Build surfaces timing, counts, and validation diagnostics.
- **Integrity**: Validation layers (front‑matter, links, HTML, a11y) gate merges.

---

## 2. Directory Structure

```
./scripts/cms/                 # CMS pipeline: discover → parse → normalize → indices → render → assets
./scripts/template-engine/     # Template engine (include / extend / blocks / expressions / loops / switch / md / filters)
./data/                        # Markdown sources (1 file = 1 post); front‑matter driven
./src/                         # Generated (and tweakable) HTML & assets prior to final build
  ├─ templates/                # Page-level templates: post, month, tag, series
  ├─ layouts/                  # Reusable layouts (base, alt, minimal)
  ├─ components/               # HTML partials/components (header, footer, nav, card, pagination, etc.)
  ├─ assets/                   # Images, icons, fonts, logos, favicons, static JS libs (e.g. pix-highlighter bundle)
  ├─ scripts/                  # Small vanilla JS (search, theme switch, highlighter init, menu toggle)
  ├─ styles/                   # Layered CSS (reset, tokens, base, layout, components, utilities, overrides)
  ├─ 404.html                  # Extends base layout
  ├─ about.html                # Extends base layout
  ├─ index.html                # Extends base layout (latest posts + pinned)
  ├─ playground.html           # Extends base layout
  ├─ offline.html              # Extends base layout (PWA / SW fallback)
  └─ search.html               # Extends base layout (client-side behavior)
./dist/                        # Final optimized artifact (minified, hashed assets) derived from ./src
./.github/                     # Workflows CI/CD + automation + Copilot rules
```

---

## 3. Stack & Dependencies

**Runtime**: None (pure HTML/CSS/JS shipped). No third‑party runtime frameworks.

**Build‑time Dev Dependencies**:

- **@biomejs/biome** – Lint & format JS/CSS.
- **gray-matter** – Front‑matter parsing.
- **jsdom** – DOM manipulation during CMS/template rendering.
- **marked** – Markdown → HTML renderer.
- **postcss** + **postcss-combine-media-query** – CSS processing & media query consolidation.
- **pix-highlighter** – Internal syntax highlighting component (vanilla; enhances <pre><code> blocks at runtime). No external lib.
- **vite** – Asset bundling & optimization.

> Every library is strictly confined to build‑time or distributed as inert static asset (no client dependency chain).

---

## 4. Data Model & Normalization

### 4.1 Accepted Front‑matter (per Markdown in `./data/posts/*.md`)

| Field           | Type                    | Required | Default | Notes                                                                       |
| --------------- | ----------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `title`         | string                  | YES      | –       | Human readable title                                                        |
| `date`          | ISO 8601 / `YYYY-MM-DD` | YES      | –       | Publication date (UTC assumed)                                              |
| `published`     | boolean                 | NO       | `true`  | If `false`, excluded from public indices/pages (still discoverable in scan) |
| `tags`          | string[]                | NO       | `[]`    | Simple array; normalization creates objects                                 |
| `description`   | string                  | NO       | –       | Used for meta & card excerpt                                                |
| `canonical_url` | string \| false         | NO       | –       | Overrides computed canonical; `false` suppresses tag                        |
| `cover_image`   | string                  | NO       | –       | Relative path under post assets                                             |
| `series`        | string \| string[]      | NO       | `[]`    | One or many series membership values                                        |
| `pinned`        | boolean                 | NO       | `false` | Elevated ordering on listings (home, tag, month, series)                    |
| `scheduledAt`   | ISO datetime            | NO       | –       | Future-dated publication (excluded until date <= now)                       |
| `layout`        | string                  | NO       | `post`  | Layout override (sanitized against allow‑list)                              |
| `keywords`      | string[]                | NO       | –       | Optional explicit search boosting tokens                                    |

### 4.2 Normalization (camelCase in internal JSON)

Front‑matter → normalized post object:

- `canonical_url` → `canonicalUrl`
- `cover_image` → `coverImage`
- `date` → `date` (ISO string) plus derived `dateString` (localized, en-US short / configurable)
- `tags` → `tags: Array<{ key, label, url }>` (kebab‑case key; label capitalized)
- `series` → `series: Array<{ key, label, url }>` (supports multi membership)
- `title`, `published`, `description`, `pinned`, `keywords` pass through
- `name` – slug derived from filename (`YYYY-MM-DD-slug`)
- `path` – `./src/posts/YYYY-MM-DD-slug.html`
- `layout` – sanitized layout id
- `content` – rendered (sanitized) HTML
- `excerpt` – first N chars / sentences (HTML‑stripped) for listings (deterministic)
- `readingTime` – optional computed metric (words / 200 wpm, ceiling) (non-blocking enhancement)

### 4.3 Generated Static Indices

All emitted into `./src/` for consumer pages & `search.html`:

- **`posts.json`** – Complete normalized published posts sorted by `date` desc (pinned ordering applied when consumed, not baked unless needed for performance).
- **`tags.json`** – Tag catalogue: `{ key, label, url, count }`.
- **`months.json`** – Monthly archive: `{ key: 'YYYY-MM', label, from, to, path, count }`.
- **`series.json`** – Series catalogue: `{ key, label, url, count, posts: [postName...] }`.

> Indices exclude unpublished or future (`scheduledAt > now`) items. Draft detection = `published: false` OR `scheduledAt` future.

---

## 5. CMS (`./scripts/cms`) – Responsibilities

### 5.1 Pipeline (Single Pass with Caches)

1. **Discovery** – Enumerate `./data/posts/**/*.md` (exclude hidden, underscore, or temp files).
2. **Parse** – Extract front‑matter (gray-matter) + body Markdown → HTML (marked) with custom renderer hooks (headings id, code block class injection for highlighter).
3. **Normalize** – Apply mapping rules (see §4.2), generate slug, compute derived fields, sanitize HTML (allow‑list tags/attrs), filter unpublished / scheduled.
4. **Index Generation** – Emit/update: `posts.json`, `tags.json`, `months.json`, `series.json` atomically (write temp + rename). Guarantee stable ordering.
5. **Template Materialization** – Ensure presence of scaffolding (idempotent): create `./src/templates/*` & `./src/layouts/*` if missing using canonical boilerplates (never overwrite if file exists unless forced flag). Required templates: `post.html`, `month.html`, `tag.html`, `series.html`.
6. **Page Rendering** – For each post, tag, month, series produce deterministic HTML via template engine. Generate base pages: `index.html`, `about.html`, `playground.html`, `offline.html`, `search.html`, `404.html` (all extend base layout via `<extends src="./layouts/base.html">`).
7. **Assets Handling** – Copy referenced media into `./src/assets` maintaining relative structure; perform optional lightweight optimization (lossless) (future milestone).
8. **Reporting** – Output summary (counts, warnings, drafts skipped, broken references) to console & optional JSON report.

### 5.2 CLI Commands

- `cms:clean` – Purge generated artifacts (`./src/posts`, indices, caches) without removing manual pages.
- `cms:scan` – Dry-run: discovery + parse + normalize + summary (no write except report if flagged).
- `cms:build` – Full pipeline (steps 1→8) with timing.
- `cms:watch` – Watch `./data`, `./src/templates`, `./src/layouts`, `./src/components` for incremental rebuild (invalidate affected indices/pages only).
- `cms:validate` – Schema/front‑matter validation + internal link & asset existence + optional external link HEAD checks (rate-limited).

### 5.3 Content Conventions

- Filenames: `YYYY-MM-DD-slug.md` (enforced by regex) – uniqueness required.
- Tags: input free form → normalized kebab `key`; display `label` capitalized.
- Series: each value normalized like tags; multi-membership allowed (order preserved from front‑matter for display ordering).
- Images: relative paths; alt text mandatory in Markdown; copied under `./src/assets`.
- Draft / scheduled posts: excluded from indices and rendered pages; may appear in `cms:scan` report with status.

---

## 6. Template Engine (`./scripts/template-engine`)

### 6.1 Supported Syntax

- **Extend/Block**: `<extends src="...">`, `<block name="...">`.
- **Include**: `<include src="..." />` (path relative to calling file).
- **Expressions**: `{{ variable | filterA | filterB:parameterExpression1:parameterExpression2 }}` (auto HTML escape unless `| raw`).
- **Conditionals**: `<if condition="expr">…</if>`.
- **Loops**: `<for each="item in list">…</for>` (supports index via `loop.index`).
- **Switch**: `<switch expr="..."><case value="...">…</case><default>…</default></switch>`.
- **Inline Markdown**: `<md> ...markdown... </md>` or filter `| md`.

### 6.2 Rendering API

- `render(templatePath, locals, options): string` – synchronous entry point.
- `compile(templatePath): (locals) => string` – optional cached renderer.
- `registerFilter(name, fn)` – filter registry (built‑ins: `upper`, `lower`, `capitalize`, `slug`, `md`, `date`, `escapeHtml`, `default`).

### 6.3 Safety & Robustness

- **Escaping**: auto escaping for interpolations; explicit opt‑out via `| raw`.
- **Sandboxed Expressions**: Parser disallows arbitrary code execution.
- **Path Traversal Guard**: Normalized paths confined within project root.
- **Source Mapping**: Errors include file, line, column, snippet context.
- **Deterministic Output**: Whitespace & indentation consistency required (failing tests block regressions).

### 6.4 FORBIDDEN Syntax (Critical Rule)

**⚠️ NEVER use Liquid/Jekyll syntax in templates. This project uses a CUSTOM template engine.**

❌ **Forbidden patterns** (will cause build failures):

````html
Use the custom template engine tags instead of Liquid/Jekyll. Examples: ```html
<if condition="..."> <!-- ... --> </if>
<for each="item in array"> <!-- ... --> </for>
<include src="template.html"></include>
<extends src="layout.html"></extends>
<!-- assign equivalent handled in code or with local data passed to includes -->
````

````

✅ **Correct custom syntax**:
```html
<if condition="user.isActive">
  <p>Welcome {{ user.name }}!</p>
</if>

<for each="post in posts">
  <article>{{ post.title }}</article>
</for>

<include src="../components/header.html" data='{ "current": "home" }'></include>
<extends src="layouts/base.html"></extends>
````

> **Enforcement**: CI/CD pipeline will reject any templates containing `{%` or `%}` patterns.

---

## 7. Generated Source (`./src`) – Required Artifacts

| Category   | Required Files                                                                                                                                                                                                                                                 | Purpose                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Layouts    | `layouts/base.html`, `layouts/alt.html`, `layouts/minimal.html`                                                                                                                                                                                                | Base scaffolding, alternate variant, reduced chrome |
| Templates  | `templates/post.html`, `templates/tag.html`, `templates/month.html`, `templates/series.html`                                                                                                                                                                   | Mapping data → page body blocks                     |
| Components | `components/header.html`, `components/footer.html`, `components/nav.html`, `components/post-card.html`, `components/tag-chip.html`, `components/series-card.html`, `components/pagination.html`, `components/skip-link.html`, `components/theme-switcher.html` | Reusable fragments                                  |
| Pages      | `index.html`, `about.html`, `playground.html`, `offline.html`, `search.html`, `404.html`                                                                                                                                                                       | Top-level pages extending `base.html`               |

All top-level pages MUST start with `<extends src="./layouts/base.html">` and implement one or more `<block>` sections.

---

## 8. Accessibility (WCAG 2.2 AAA Patterns)

### Functional Requirements

- ARIA Landmarks: `header`, `nav`, `main`, `aside` (contextual), `footer`, `form[role=search]`.
- **Skip Link**: Visible on focus, first interactive element, jump to `#main-content`.
- **Focus Management**: Natural tab order; never remove outlines; manage focus after client-side updates (search results announcement region).
- **Contrast**: AAA target for text/icons; enforced via design token palette tests.
- **Semantic Structure**: Proper heading hierarchy; lists, tables with headers; `figure/figcaption` for media.
- **Media Alt Text**: All images require meaningful `alt`; decorative images use empty alt.
- **Keyboard-only Support**: All interactions accessible; no focus traps; visible focus ring.
- **Live Regions**: Search results count & pagination updates announced via `aria-live="polite"`.
- **Reduced Motion**: Honor `prefers-reduced-motion`; disable non-essential transitions, using media queries.

### Acceptance Criteria (Excerpt)

- Lighthouse Accessibility score: 100 (informational but not sole gate).
- No critical HTML validation errors.
- Automated axe-core scan passes for generated pages in CI.
- Manual screen reader (VoiceOver + NVDA) smoke flows: Home → Post → Tag → Search.

---

## 9. Build Pipeline (Vite)

1. **Input**: `./src` (already validated/generated by CMS).
2. **JS Bundling**: Multi-entry (index, search, theme, highlighter init). ES modules, tree-shaken.
3. **CSS Processing**: PostCSS pass, media query consolidation, minification, critical CSS optional extraction (future milestone).
4. **HTML Emission**: Vite transforms and emits the generated HTML without a standalone minifier so semantic structure and a11y-sensitive attributes remain intact.
5. **pix-highlighter**: Lightweight init script (deferred) + optional theme tokens.
6. **Output**: `./dist` with hashed assets, source maps (production), deterministic chunk naming.
7. **Integrity Step (Optional)**: Generate SRI hashes for static assets (future security milestone).

---

## 10. Client-side Search (`./src/search.html`)

**Data Sources**: `posts.json`, `tags.json`, `months.json`, `series.json` (same origin preferred; fallback static URL fetch).

### Features

- Index fields: `title`, `description`, tag labels, series labels, derived keywords, optional extracted content keywords (build time).
- Scoring (descending): exact title match > prefix title > tag/series label > description > keyword.
- Debounced input (150ms) & simple in-memory index (dataset size small).
- Accessible form (`role="search"`) + live region announcements.
- URL persistence via `?q=` and `&page=` parameters.
- Keyboard shortcuts: `/` focuses search, `Esc` clears.
- No-JS fallback: Links to tag, month, series listing pages.

### Out of Scope (Initial)

- Fuzzy phonetic matching
- Web Worker indexing (unnecessary scale)
- Weighted ML ranking

---

## 11. CI/CD Workflows (`./.github`)

- **build.yml**
  - Setup Node (LTS), install dev deps (frozen‑lockfile), `cms:build`, `vite build`.
  - Esegue audit accessibilità veloce su HTML generati (facoltativo).
  - Carica artifact `./dist`.

- **deploy-gh-pages.yml** (opzione A)
  - Deploy su GitHub Pages (branch `gh-pages`).

- **deploy-netlify.yml** (opzione B)
  - Trigger Netlify build via API.

- **COPILOT_RULES.md** e **copilot-instructions.md**
  - Regole d’uso (tono, formati commit, convenzioni codice, policy PR, note su a11y e vanilla‑first).

---

## 12. Suggested NPM Scripts (Excerpt)

```json
{
  "scripts": {
    "lint": "biome check .",
    "format": "biome format .",
    "cms:clean": "node ./scripts/cms/clean.mjs",
    "cms:build": "node ./scripts/cms/build.mjs",
    "cms:watch": "node ./scripts/cms/watch.mjs",
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 13. Testing & Quality

### 13.1 Test Coverage Requirements (MANDATORY)

**Node.js Standards**:

- **Import Format**: ALL Node.js built-in modules MUST use `node:` prefix:
  - `import { readFileSync } from 'node:fs'` ✅
  - `import { join, dirname } from 'node:path'` ✅
  - `import { fileURLToPath } from 'node:url'` ✅
- **Package Manager**: Use `pnpm` exclusively for all operations
- **ES Modules**: All scripts use ES modules with proper imports/exports

**Unit Tests** (Node.js):

- **CMS Components** (scripts/cms/tests/):
  - `post-processor.test.js` - Parser front‑matter, normalizzazione tag/slug, data validation
  - `index-generator.test.js` - Generazione indici posts/tags/months, sorting, data integrity
  - `page-generator.test.js` - Template rendering, context passing, file generation
  - `scan.test.js` - File discovery, markdown parsing, error handling
  - `validate.test.js` - Front matter validation, link checking, asset validation

- **Template Engine** (scripts/template-engine/tests/):
  - `expression-parser.test.js` - Expression parsing, filter application, error handling
  - `renderer.test.js` - Template rendering, include/extend resolution, context passing
  - `filters.test.js` - All built-in filters (upper/lower/capitalize/slug/md/date/escapeHtml)
  - `template-resolution.test.js` - Path resolution **relativi al file chiamante**

**Integration Tests**:

- **End-to-End Workflows** (tests/):
  - `cms-workflow.test.js` - Complete data → HTML generation pipeline
  - `template-integration.test.js` - Template engine + CMS integration
  - `asset-handling.test.js` - Image copying, path resolution, asset optimization

**HTML Quality Tests**:

- **Structure Validation** (tests/html/):
  - `html-validation.test.js` - W3C HTML5 validation for all generated files
  - `accessibility.test.js` - axe-core validation, ARIA compliance, semantic structure
  - `formatting.test.js` - Prettier formatting compliance, consistent indentation
  - `link-validation.test.js` - Internal link checking, asset existence verification

**Coverage Standards**:

- **Minimum coverage**: 85% for all CMS and template engine modules
- **Critical paths**: 100% coverage for data processing and HTML generation
- **Error scenarios**: All error conditions must be tested
- **Edge cases**: Empty data, malformed input, missing files

### 13.2 HTML Quality Assurance (MANDATORY)

**Template Engine Requirements**:

- **Built-in Formatting**: Template engine MUST generate properly formatted HTML from the start
- **Indentation Management**: Track and maintain proper indentation levels during rendering
- **Component Composition**: Include/extend operations must preserve formatting
- **Root Cause Fixing**: HTML formatting issues must be fixed at the template engine level, not post-processed

**Formatting Requirements**:

- **Prettier compliance**: All generated HTML must pass `prettier --check`
- **Consistent indentation**: 2 spaces, no tabs, proper nesting
- **Line length**: Target 100 characters, break long attributes appropriately
- **Tag formatting**: Proper spacing, attribute ordering, self-closing tags

**Validation Pipeline**:

```bash
# HTML formatting validation
pnpm run format:check:html     # Prettier format check
pnpm run format:html          # Auto-format HTML files

# Structure validation
pnpm run validate:html        # W3C HTML5 validation
pnpm run validate:structure   # Semantic structure check
pnpm run validate:links       # Internal link validation
pnpm run validate:a11y        # Accessibility validation
```

**Quality Gates** (CI/CD):

- **Blocking checks**: HTML validation, formatting, accessibility
- **Warning checks**: Performance budgets, asset optimization
- **Manual checks**: Screen reader testing, keyboard navigation

### 13.3 Development Workflow Integration

**Pre-commit Hooks**:

- Format check for generated HTML
- Fast test suite execution
- Link validation for changed files

**CI/CD Pipeline**:

- Full test suite execution
- Complete HTML validation
- Accessibility audit
- Performance budget validation
- Coverage reporting

**Snapshot Testing**:

- **Template Output**: Snapshot HTML generated for sample posts/tags/months
- **Regression Prevention**: Detect unintended template changes
- **Data Consistency**: Verify identical input produces identical output

### 13.4 Error Handling & Diagnostics

**Template Engine Errors**:

- **Source mapping**: Errors include file path, line number, column
- **Context preservation**: Show surrounding template code in error messages
- **Graceful degradation**: Invalid templates don't break entire build

**CMS Error Handling**:

- **Validation errors**: Clear messages for invalid front matter
- **Missing files**: Helpful guidance for broken references
- **Build errors**: Detailed logs with recovery suggestions

**Quality Metrics**:

- **Build performance**: Track generation time per page/component
- **Template complexity**: Monitor include/extend depth, loop iterations
- **Coverage trends**: Track test coverage over time

---

## 14. Non-functional Requirements

- **Performance**: First-load JS ≤ 50KB (compressed) for baseline pages; critical CSS inline ≤ 10KB (home/post target); lazy-load non-critical images.
- **Security**: No unsandboxed dynamic evaluation; HTML escaping by default; optional CSP & SRI (later milestone).
- **SEO**: Standard meta, OpenGraph, JSON‑LD BlogPosting; generate `sitemap.xml`, `robots.txt` at build.
- **Maintainability**: Small focused templates/components; consistent naming; minimal necessary comments.
- **Resilience**: Offline page (`offline.html`) served by Service Worker (optional future enhancement) – ensure graceful degradation if SW absent.

---

## 15. Conventions

- **Slugs**: Derived from filename; non-alphanumerics → `-`; multiple hyphens collapsed.
- **Tags**: `key` kebab-case; `label` capitalized; page: `./tags/<key>.html`.
- **Months**: Key `YYYY-MM`; page: `./months/YYYY-MM.html`.
- **Series**: `key` kebab-case; listing: `./series/<key>.html`; aggregate index page (future) `./series/index.html`.
- **Images**: Relative paths inside post content; mandatory `alt`; target path under `./src/assets/images/...`.
- **Dates**: Stored as ISO strings; display formatting remains English (`en-US`).
- **Ordering**: Pinned posts prioritized then date desc.

---

## 16. Minimal Roadmap (MVP → Plus)

- **MVP**: CMS pipeline, template engine core, post/tag/month pages, basic `search.html`, Vite build, deploy.
- **Plus**: Series pages + index, related posts (tag/series), prev/next navigation, print styles, dark mode + accent selection, sitemap & feeds, offline support.

---

## 17. Open Questions / To Validate

- Series aggregate root page structure (`/series/`): implemented in MVP or deferred?
- Strategy for long series pagination (if series length > PAGE_SIZE)?
- Reading time & word count acceptance criteria (rounding rules).
- English-only slugs remain canonical; no multilingual routing is planned.
- Service Worker scope & caching strategy boundaries (offline minimal vs. full shell).

---

Last updated: (auto-update expected in future automation) – Manual update for series integration & English translation.

- pix-highlighter theme tokens (naming, light/dark variants) & language coverage.
- Necessità di feed RSS/Atom.
- Politica cache CDN (max‑age, immutable) e gestione 404 su hosting scelto.
- Eventuale integrazione `about.html` con contenuti dinamici (es. repo stats GitHub) → se sì, solo client‑side.

---

## 18) Deliverables

- Struttura cartelle iniziale + file stub minimi per CMS e template engine.
- Template base (`post.html`, `tag.html`, `month.html`) + un `layout.html` e alcuni componenti (`header`, `post-card`).
- Script NPM + config Vite/PostCSS/Biome.
- Workflows CI/CD pronti al deploy.

## 19) Roadmap Plus (estensioni suggerite con impatto/sforzo)

> Tutte le funzioni sono progettate “vanilla‑first” (0 dipendenze a runtime). Eventuali librerie menzionate rientrano **solo** tra le dev‑dependencies e sono **opzionali**.

### 19.1 Contenuti & authoring

- **Draft & Scheduled Publishing**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna (cron CI)
  - Checklist: front‑matter `draft`/`scheduledAt`; esclusione dai listing; job CI che pubblica alla data.

- **Series (collezioni di post)**
  - Impatto: **Alto** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: campo `series`, pagina indice serie, prev/next intra‑serie, breadcrumb aggiornato.

- **Related posts**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: nessuna
  - Checklist: matching per tag/mese; fallback su similarità titolo; max 4 elementi con descrizioni concise.

- **Link posts** (segnalazioni)
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: `link` nel front‑matter; `rel="noopener"`/`nofollow` configurabile; canonical esterno coerente.

- **TOC auto‑generata**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: `<nav aria-labelledby="on-this-page">`; anchor sicure; skip link alla TOC.

- **Footnotes accessibili**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: ancore bidirezionali; `aria-describedby`/`aria-label` adeguati; focus return.

- **Reading time & progress bar**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: calcolo WPM in build; barra con rispetto `prefers-reduced-motion`.

### 19.2 Accessibilità & UX

- **Tema High‑Contrast + Dark/Light**
  - Impatto: **Alto** · Sforzo: **Medio** · Dipendenze: nessuna
  - Checklist: supporto `prefers-contrast`/`prefers-color-scheme`; toggle persistito; contrasto AAA.

- **Riduzione animazioni**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: media query `prefers-reduced-motion`; rimozione parallax/transizioni non essenziali.

- **Keyboard shortcuts opzionali**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: `/` → focus search; help scorciatoie; `aria-describedby` e disattivazione via preferenze.

- **Annunci ARIA (live regions)**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: `aria-live="polite"` per risultati ricerca/paginazione; messaggi non intrusivi.

- **Print stylesheet**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: contenuto principale, link espansi tra parentesi, rimozione elementi decorativi.

### 19.3 Performance & immagini

- **Responsive images (srcset/sizes)**
  - Impatto: **Alto** · Sforzo: **Medio** · Dipendenze: **opz.** `sharp` per generare varianti
  - Checklist: `loading=lazy`, `decoding=async`, `fetchpriority` solo per LCP; audit LCP migliorato.

- **AVIF/WebP con fallback**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: **opz.** `sharp`
  - Checklist: picture‑element; fallback PNG/JPEG; controllo dimensioni.

- **Critical CSS inline + estrazione per pagina**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: nessuna
  - Checklist: CSS critico sotto 10KB; nessun FOIT/FOUT indesiderato.

- **Preload mirato**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: `<link rel="preload">` per font/CSS critici; evitare over‑preloading.

### 19.4 SEO & social

- **JSON‑LD** (`BlogPosting`, `BreadcrumbList`, `SearchAction`)
  - Impatto: **Alto** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: validazione con Rich Results Test; campi obbligatori valorizzati.

- **OG/Twitter cards**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: immagini 1200×630; titolo ≤ 60–70; descrizione ≤ 160.

- **OG‑image generator (build‑time)**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: **opz.** `puppeteer` o `node-canvas`
  - Checklist: template coerente; generazione on‑demand; cache.

- **Sitemap.xml & robots.txt**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: URL canonici; esclusione bozza/draft.

- **RSS/Atom/JSON Feed**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: feed validi; includere titolo, link, date, summary.

### 19.5 Ricerca (client‑side)

- **Filtri per tag/mese + ordinamento**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: combinazione filtri; stato URL (query string); annunci ARIA dei risultati.

- **Fuzzy match leggero**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: nessuna
  - Checklist: trigrammi o Levenshtein; sinonimi configurabili.

- **Indicizzazione “a pagine”**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: chunk JSON; debounce 150ms; evitare blocchi main‑thread.

### 19.6 PWA (opzionale)

- **Service Worker per cache offline**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: nessuna (SW vanilla)
  - Checklist: strategie cache‑first per pagine; network‑first per indici; aggiornamento controllato.

- **App Manifest**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: icone, tema, display `minimal-ui`; installabilità verificata.

### 19.7 Analytics & privacy

- **Analytics senza cookie**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna (server‑logs o script minimale)
  - Checklist: eventi outbound/copy; rispetto `DNT`.

### 19.8 Sicurezza

- **CSP strict + SRI**
  - Impatto: **Alto** · Sforzo: **Medio** · Dipendenze: nessuna
  - Checklist: default‑src 'self'; nonce/hash per inline; SRI per asset terzi.

- **Sanitizzazione Markdown (build)**
  - Impatto: **Alto** · Sforzo: **Basso** · Dipendenze: nessuna (whitelist semplice)
  - Checklist: rimozione tag/script non consentiti; escape sicuro.

### 19.9 CI/CD & qualità

- **Link checker + spell‑check**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: link interni/asset validi; dizionari it/en.

- **A11y CI (axe) + color‑contrast lint**
  - Impatto: **Alto** · Sforzo: **Medio** · Dipendenze: **opz.** axe a build‑time
  - Checklist: 0 errori critici; contrasti AAA garantiti.

- **Visual regression test**
  - Impatto: **Medio** · Sforzo: **Medio** · Dipendenze: **opz.** `pixelmatch`/screenshot headless
  - Checklist: baseline per template chiave; diff < soglia.

- **Bundle budget**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: fail build se JS per pagina > 50KB; report dimensioni in CI.

### 19.10 Language policy

- **English-only publishing**
  - Impact: **Medium** · Effort: **Low** · Dependencies: none
  - Checklist: keep UI, metadata, feeds, and editorial copy aligned to one canonical English locale.

### 19.11 Community & interazioni

- **Webmentions (ingest in build)**
  - Impatto: **Basso** · Sforzo: **Medio** · Dipendenze: **opz.** endpoint webmention.io
  - Checklist: moderazione via JSON; UI minimale sotto al post.

- **Giscus / commenti su issue**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna (embedding deferito)
  - Checklist: caricamento on‑interaction; `prefers-reduced-motion` rispettato.

### 19.12 Dev‑Experience

- **CLI “nuovo post”**
  - Impatto: **Medio** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: boilerplate front‑matter; cartella immagini; naming corretto `YYYY‑MM‑DD‑slug.md`.

- **Anteprima bozze**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: server dev che include draft; watermark “Bozza”.

- **Regole Copilot**
  - Impatto: **Basso** · Sforzo: **Basso** · Dipendenze: nessuna
  - Checklist: snippet esempio, checklist a11y, convenzioni commit.

## 20) Delta – Specifiche richieste (paginazione, skip‑link, lazy reveal, cutting‑edge + policy browser)

Questa sezione integra e dettaglia funzioni già accennate nel canvas, rendendole **vincolanti** con accettazione e implementazione.

### 20.1 Paginazione universale (liste post)

**Scope**: pagine _Mese_, _Tag_ (statiche, generate dal CMS) e _Ricerca_ (client‑side).

**Regole comuni**

- **Dimensione pagina**: `PAGE_SIZE = 10` (configurabile in `./scripts/cms/config.mjs`).
- **Navigazione**: `<nav aria-label="Pagination">` con **first / prev / numeri / next / last**.
- **Accessibilità**: stato pagina corrente con `aria-current="page"`; ellissi non cliccabili con `aria-hidden="true"` e testo equivalente per SR.
- **Rel**: link con `rel="prev"` e `rel="next"` dove applicabile.

**URL statici (Tag/Mese)**

- **Pagina 1** resta l’URL “piatto” già previsto (es. `./src/tags/a11y.html`, `./src/months/2024-05.html`).
- **Pagine successive**: struttura a cartelle, es. `./src/tags/a11y/2/index.html`, `./src/tags/a11y/3/index.html` (idem per `months/YYYY-MM/<n>/index.html`).
- Il CMS genera automaticamente le sottopagine e inserisce i collegamenti nella **pagination component**.

**Ricerca (client‑side)**

- Paginazione in JS con lo stesso schema di bottoni e **annunci ARIA** (`aria-live="polite"`) che comunicano “Mostrati risultati X–Y di Z”.
- Stato della pagina serializzato in URL (es. `?q=grid&page=2`) per deep-link.

**Componenti**

- `./src/components/pagination.html` – logica numeri + ellissi inclusa via template engine.

**Criteri di accettazione**

- Tastiera: è possibile raggiungere tutti i controlli e identificare la pagina corrente.
- SEO: no duplicati—`rel=prev/next`, canonical coerenti (pagina 1 = canonical "flat").

### 20.2 Skip to content (rafforzamento)

**Component**: `./src/components/skip-link.html` incluso in tutti i layout, posizionato per primo nel `<body>`.

**Target**: l’elemento `<main id="main">` in tutti i layout (uniformato—ref §7).

**Stile**: visibile al focus, contrasto AAA, focus ring evidente; invisibile _off-focus_ ma non con `display:none`.

**Criteri di accettazione**

- Con `Tab` al primo colpo compaia il link “Salta al contenuto”.
- L’attivazione porta il focus al primo heading significativo in `<main>`.

### 20.3 Lazy images “on reveal”

**Approccio**: doppio livello

1. **Native lazy**: `loading="lazy"`, `decoding="async"` di default.
2. **On‑reveal** via **IntersectionObserver**: immagini inizialmente con `data-src`/`data-srcset`; al reveal impostiamo `src`/`srcset` e applichiamo una classe `is-revealed` per una transizione **soft**.

**Fallback**: se `IntersectionObserver` non è supportato → degrada al solo `loading="lazy"` (puro HTML). Sempre presente `<noscript>` con immagine eager.

**Accessibilità & motion**: animazioni di reveal disattivate con `@media (prefers-reduced-motion: reduce)`.

**Criteri di accettazione**

- Nessun layout shift significativo (riservare dimensioni con `width`/`height` o CSS `aspect-ratio`).
- Immagine _LCP_ può usare `fetchpriority="high"` e non è lazy.

### 20.4 Cutting‑edge APIs + Policy browser “last 2 majors”

**Policy di supporto**

- Target: **ultime 2 major** stabili di Chrome, Firefox, Safari, Edge.
- Niente polyfill di compatibilità estesi; **progressive enhancement** obbligatorio.

**Impostazioni build**

- Vite: `build.target = 'es2022'` (o `esnext` se non rompe) e output ESM.
- `browserslist` (documentativo, per audit) nel `package.json`:
  - `"last 2 Chrome versions", "last 2 Firefox versions", "last 2 Safari versions", "last 2 Edge versions"`.
  - (Autoprefixer non è richiesto; resta opzionale e non incluso.)

**API moderne da utilizzare con PE**

- **View Transitions API** per transizioni pagina/tema: uso condizionale `if ('startViewTransition' in document) { ... }`.
- **Navigation API** per intercettare navigazioni interne _non-breaking_ dove utile; fallback tradizionale.
- **IntersectionObserver** per lazy‑reveal di immagini e osservazioni sezioni (TOC attiva).
- **requestIdleCallback** (con fallback a `setTimeout`) per lavori non critici (indicizzazione ricerca, ecc.).
- **CSS avanzato** (senza build): `:has()`, **Container Queries** (`@container`), `accent-color`, `color-mix()`, `:focus-visible`, media `prefers-contrast`/`prefers-reduced-motion`.

**Criteri di accettazione**

- Con feature disattivata/assente, l’esperienza resta funzionale e accessibile (no errori JS).
- Documentazione in `README` della policy e dei fallback applicati.
